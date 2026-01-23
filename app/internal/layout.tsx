import AuthProvider from "@/frontend/providers/auth-provider";
import { Sidebar } from "../components/Sidebar";

const InternalLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <AuthProvider>
            <Sidebar>
                {children}
            </Sidebar>
        </AuthProvider>
    );
}

export default InternalLayout;