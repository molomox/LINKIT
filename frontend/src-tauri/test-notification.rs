// Minimal Tauri notification test
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri_plugin_notification::Notification;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|_app| {
            tauri_plugin_notification::notify(
                "Test notification Tauri",
                Some("Si tu vois ça, les notifications desktop fonctionnent."),
                None,
                None,
            );
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
