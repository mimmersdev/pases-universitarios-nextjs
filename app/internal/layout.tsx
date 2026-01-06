import { Sidebar } from "../components/Sidebar";

const UniversitiesLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <Sidebar>
            {children}
        </Sidebar>
    );
}

export default UniversitiesLayout;