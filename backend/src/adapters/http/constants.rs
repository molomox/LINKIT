pub const OK_RESPONSE: &str =
    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE\r\nAccess-Control-Allow-Headers: Content-Type\r\n\r\n";
pub const NOT_FOUND: &str = "HTTP/1.1 404 NOT FOUND\r\n\r\n";
pub const INTERNAL_ERROR: &str = "HTTP/1.1 500 INTERNAL ERROR\r\n\r\n";
pub const BAD_REQUEST: &str = "HTTP/1.1 400 BAD REQUEST\r\n\r\n";

pub fn db_url() -> String {
    fn clean(value: String) -> String {
        value.trim().trim_matches('"').to_string()
    }

    if let Ok(url) = std::env::var("DATABASE_URL") {
        let url = clean(url);
        if !url.is_empty() {
            return url;
        }
    }

    if let Ok(url) = std::env::var("POSTGRES_URL") {
        let url = clean(url);
        if !url.is_empty() {
            return url;
        }
    }

    panic!("DATABASE_URL ou POSTGRES_URL doit être défini");
}
