"use client";
import { useSignupController } from "./signup.controller";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
    const controller = useSignupController();

    return (
        <SignupForm
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
        />
    );
}
