FROM rust:1.91 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/payment .
EXPOSE 8000
CMD ["./payment"]
