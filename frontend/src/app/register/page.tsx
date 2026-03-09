"use client";
import { useRegisterController } from "./register.controller";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
    const controller = useRegisterController();

    return (
        <RegisterForm
            username={controller.username}
            email={controller.email}
            password={controller.password}
            status={controller.status}
            result={controller.result}
            isLoading={controller.isLoading}
            onUsernameChange={controller.setUsername}
            onEmailChange={controller.setEmail}
            onPasswordChange={controller.setPassword}
            onSubmit={controller.handleSubmit}
            onNavigateToLogin={controller.navigateToLogin}
        />
    );
}
