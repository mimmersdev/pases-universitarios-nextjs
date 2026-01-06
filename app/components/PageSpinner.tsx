import { Spinner } from "@/components/ui/spinner";

const PageSpinner: React.FC = () => {
    return (
        <div className="flex justify-center items-center h-screen">
            <Spinner className="w-10 h-10" />
        </div>
    );
};

export default PageSpinner;