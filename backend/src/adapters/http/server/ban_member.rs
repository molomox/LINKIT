use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::ports::user_repository::UserRepository;
use axum::extract::{Path, State};
use axum::Json;
use serde::Deserialize;
use crate::domain::ports::ban_repository::BanRepository;
use crate::domain::entities::ban::Ban;
use chrono::Utc;

#[derive(Deserialize)]
pub struct BanMemberRequest {
    pub banner_user_id: String, //Celui qui ban 
    pub reason : String, // Raison du ban
}

pub async fn ban_member_handler(
    State(state): State<AppState>,
    Path((server_id, target_user_id)):Path<(String, String)>,
    Json(payload): Json<BanMemberRequest>,
) ->  Result<Json<()>, ApiError> {
    let banner_user_id = payload.banner_user_id.clone();
    let reason = payload.reason.clone();
    let target_user_id_clone = target_user_id.clone();
    let server_id_clone = server_id.clone();


    // Checks Permissions de ban
    let(target_username, banned) = tokio::task::spawn_blocking(move || {
        let member_repo = PostgresMemberRepo;
        let user_repo = PostgresUserRepo;

        //Recuperer la personne qui ban
        let banner_member = member_repo
            .get_by_user_and_server(banner_user_id.clone(), server_id_clone.clone())
            .map_err(|e| format!("Utilisateur Non trouver:  {}", e))?;


        //Recuperer la personne bannie
        let target_member = member_repo
            .get_by_user_and_server(target_user_id_clone.clone(), server_id_clone.clone())
            .map_err(|e| format! ("Utilisateur Non trouver: {}",e ))?;

        // Verifier que le banner est soit Owner (role04) soit Admin (role03)
        if banner_member.role.role_id != "role04" && banner_member.role.role_id != "role03"{
            return Err("Permission Refusée: Seul Owner ou Admin peut ban".to_string());
        }

        // Verifier que l'on peut pas ban un Owner
        if target_member.role.role_id == "role04" {
            return Err("Impossible de ban le Owner".to_string());
        }

        // Verrifier qu'un Admin ne peut pas ban un autre Admin
        if target_member.role.role_id == "role03" && banner_member.role.role_id == "role03" {
            return Err("Vous ne pouvez pas bannir un autre Admin.".to_string());
        }

        // Recuperer le username de la personne bannie 
        let target_user = user_repo
            .find_by_id(target_user_id_clone.clone())
            .map_err(|e| format!("Utilisateur Non trouver: {}", e))?;

        // Effectuer le ban 
        let ban = Ban{
            user_id: target_user_id_clone.clone(),
            server_id: server_id_clone.clone(),
            reason: reason.clone(),
            create_at: chrono::Utc::now().to_rfc3339(),
        };

        //let ban_repo = state.ban_repo.clone();
        //ban_repo.save(ban).map_err(|e| format!("Echec du ban: {}", e))?;

        member_repo
            .delete_member(target_user_id_clone.clone(), server_id_clone.clone())
            .map_err(|e| format!("Echec du ban: {}", e))?;

        Ok((target_user.username, ()))
    }).await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(e))?;


    let banned_msg = WsMessage::MemberBanned{
        user_id: target_user_id.clone(),
        username: target_username,
        server_id: server_id.clone(),
    };


    state.broadcast_to_server(&server_id, banned_msg).await;

    Ok(Json(()))


}

