import React from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

type AlertProps = {
    icon: React.ReactNode;
    content: string;
};
const AlertCustom = ({ content, icon }: AlertProps) => {
    return (
        <Alert className="fixed top-10 left-1/2 transform -translate-x-1/2 z-9999 w-250">
            {icon}
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>{content}</AlertDescription>
        </Alert>
    );
};

export default AlertCustom;
