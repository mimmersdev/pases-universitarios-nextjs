interface SectionTitleProps {
    removeMargin?: boolean;
    children: React.ReactNode;
}
const SectionTitle: React.FC<SectionTitleProps> = ({ removeMargin = false, children }) => {
    return (
        <h3 className={`text-4xl font-bold ${removeMargin ? 'mb-0' : 'mb-10'}`}>
            {children}
        </h3>
    )
}

export default SectionTitle;