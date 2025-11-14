export const Section: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <section className="py-8 md:py-20">
            {children}
        </section>
    )
}