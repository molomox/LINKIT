use crate::domain::entities::message::Message;
use crate::domain::entities::user::User;
use crate::domain::entities::reaction::Reaction;
use crate::domain::entities::Reagi;
use crate::domain::ports::user_repository::UserRepository;
use crate::domain::ports::reaction_repository::ReactionRepository;
use crate::domain::usecases::reaction::{
    list_available_reactions::ListAvailableReactions,toggle_message_reaction::ToggleMessageReaction
};
use crate::test_unitaire::mock_repositories::MockChannelRepository;
use crate::test_unitaire::mock_repositories::MockMemberRepository;
use crate::test_unitaire::mock_repositories::MockMessageRepository;
use crate::test_unitaire::mock_repositories::MockRoleRepository;
use crate::test_unitaire::mock_repositories::MockUserRepository;
use crate::test_unitaire::mock_repositories::MockReactionRepository;
use crate::test_unitaire::mock_repositories::MockReagiRepository;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

fn make_user() -> User {
    User {
        user_id: "user-01".to_string(),
        username: "alice".to_string(),
        email: "alice@test.com".to_string(),
        password: "pass".to_string(),
        create_at: "2024-01-01".to_string(),
        token: None,
    }
}

fn make_message() -> Message {
    Message {
        message_id: "msg-01".to_string(),
        content: "Hello".to_string(),
        channel_id: "chan-01".to_string(),
        user: make_user(),
        create_at: "2024-01-01".to_string(),
        is_gif: false,
        reactions: vec![],
    }
}

fn make_reaction(reaction_id: i32) -> Reaction {
    Reaction {
        reaction_id,
        reaction_name: "like".to_string(),
        emoji: "👍".to_string(),
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_list_available_reactions() {
        let repo = MockReactionRepository::new();

        let use_case = ListAvailableReactions {
            repo: &repo,
        };

        let result = use_case.execute();

        assert!(result.is_ok());
        let reactions = result.unwrap();
        assert_eq!(reactions.len(), 4);
    }
    //  #[test]
    // fn test_ajouter_reaction_avec_succes() {
    //     let reaction_repo = MockReactionRepository ::new();
    //     let reagi_repo = MockReagiRepository::new();
    //     let usecase = ToggleMessageReaction{ reaction_repo: &reaction_repo, reagi_repo: &reagi_repo };

    //     let result = usecase.execute(make_user(), make_message(), reaction_repo.find_by_id(1).unwrap());
    //     assert!(result.is_ok());
    // }

    #[test]
    fn test_supprimer_reaction_existante() {
        let reaction_repo = MockReactionRepository ::new();
        let reagi_repo = MockReagiRepository::new();
        let usecase = ToggleMessageReaction{ reaction_repo: &reaction_repo, reagi_repo: &reagi_repo };
        reagi_repo.add_reagi(Reagi {
            user: make_user(),
            message: make_message(),
            reaction: reaction_repo.find_by_id(1).unwrap()
        });
        let result = usecase.execute(make_user(), make_message(), reaction_repo.find_by_id(1).unwrap());
        assert_eq!(result, Ok("removed".to_string()));
    }

    #[test]
    fn test_user_id_vide() {
        let reaction_repo = MockReactionRepository ::new();
        let reagi_repo = MockReagiRepository::new();
        let usecase = ToggleMessageReaction{ reaction_repo: &reaction_repo, reagi_repo: &reagi_repo };

        let mut user = make_user();
        user.user_id = "".to_string();

        let result = usecase.execute(user, make_message(), reaction_repo.find_by_id(1).unwrap());
        assert!(result.is_err());
    }

    #[test]
    fn test_message_id_vide() {
        let reaction_repo = MockReactionRepository ::new();
        let reagi_repo = MockReagiRepository::new();
        let usecase = ToggleMessageReaction{ reaction_repo: &reaction_repo, reagi_repo: &reagi_repo };

        let mut message = make_message();
        message.message_id = "".to_string();

        let result = usecase.execute(make_user(), message, reaction_repo.find_by_id(1).unwrap());
        assert!(result.is_err());
    }

    #[test]
    fn test_reaction_id_invalide() {
        let reaction_repo = MockReactionRepository ::new();
        let reagi_repo = MockReagiRepository::new();
        let usecase = ToggleMessageReaction{ reaction_repo: &reaction_repo, reagi_repo: &reagi_repo };

        let result = usecase.execute(make_user(), make_message(), make_reaction(999));
        assert!(result.is_err());
    }

    #[test]
    fn test_reaction_id_negatif() {
        let reaction_repo = MockReactionRepository ::new();
        let reagi_repo = MockReagiRepository::new();
        let usecase = ToggleMessageReaction{ reaction_repo: &reaction_repo, reagi_repo: &reagi_repo };

        let result = usecase.execute(make_user(), make_message(), make_reaction(-1));
        assert_eq!(result, Err("Veuillez entrer les paramètres nécessaires".to_string()));
    }

}
