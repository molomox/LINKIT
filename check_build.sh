#!/bin/bash
cd backend
cargo check 2>&1 | grep -E "error\[|warning:" | head -50
