use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::ports::user_repository::UserRepository;
use axum::extract::{Path, State};
use axum::Json;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct KickMemberRequest {
    pub kicker_user_id: String, // Celui qui kick
}

pub async fn kick_member_handler(
    State(state): State<AppState>,
    Path((server_id, target_user_id)): Path<(String, String)>,
    Json(payload): Json<KickMemberRequest>,
) -> Result<Json<()>, ApiError> {
    let kicker_user_id = payload.kicker_user_id.clone();
    let target_user_id_clone = target_user_id.clone();
    let server_id_clone = server_id.clone();

    // Vérifier les permissions et effectuer le kick
    let (target_username, kicked) = tokio::task::spawn_blocking(move || {
        let member_repo = PostgresMemberRepo;
        let user_repo = PostgresUserRepo;

        // 1. Récupérer le membre qui kick
        let kicker_member = member_repo
            .get_by_user_and_server(kicker_user_id.clone(), server_id_clone.clone())
            .map_err(|e| format!("Membre kickeur non trouvé: {}", e))?;

        // 2. Récupérer le membre cible
        let target_member = member_repo
            .get_by_user_and_server(target_user_id_clone.clone(), server_id_clone.clone())
            .map_err(|e| format!("Membre cible non trouvé: {}", e))?;

        // 3. Vérifier que le kickeur est Owner (role04) ou Admin (role03)
        if kicker_member.role.role_id != "role04" && kicker_member.role.role_id != "role03" {
            return Err("Permission refusée: seul Owner ou Admin peut kick".to_string());
        }

        // 4. Vérifier que la cible n'est pas Owner
        if target_member.role.role_id == "role04" {
            return Err("Impossible de kick le Owner".to_string());
        }

        // 5. Si le kickeur est Admin, il ne peut pas kick un autre Admin
        if kicker_member.role.role_id == "role03" && target_member.role.role_id == "role03" {
            return Err("Un Admin ne peut pas kick un autre Admin".to_string());
        }

        // 6. Récupérer le username de la cible
        let target_user = user_repo
            .find_by_id(target_user_id_clone.clone())
            .map_err(|e| format!("Utilisateur cible non trouvé: {}", e))?;

        // 7. Effectuer le kick (supprimer le membre)
        member_repo
            .delete_member(target_user_id_clone, server_id_clone)
            .map_err(|e| format!("Échec du kick: {}", e))?;

        Ok((target_user.username, ()))
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(e))?;

    // Broadcaster l'événement member_kicked
    let kicked_msg = WsMessage::MemberKicked {
        user_id: target_user_id.clone(),
        username: target_username,
        server_id: server_id.clone(),
    };

    state.broadcast_to_server(&server_id, kicked_msg).await;

    println!("👢 Membre kické: {} du serveur {}", target_user_id, server_id);

    Ok(Json(()))
}
