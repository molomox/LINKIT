pub const OK_RESPONSE: &str =
    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE\r\nAccess-Control-Allow-Headers: Content-Type\r\n\r\n";
pub const NOT_FOUND: &str = "HTTP/1.1 404 NOT FOUND\r\n\r\n";
pub const INTERNAL_ERROR: &str = "HTTP/1.1 500 INTERNAL ERROR\r\n\r\n";
pub const BAD_REQUEST: &str = "HTTP/1.1 400 BAD REQUEST\r\n\r\n";

pub fn db_url() -> String {
<<<<<<< HEAD
    let url = std::env::var("DATABASE_URL")
=======
    let url = std::env::var("DATABASE_URL")        
>>>>>>> origin/main
        .unwrap_or_else(|_| "${DATABASE_URL}".to_string());
    url

}
