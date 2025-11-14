interface ContainerProps {
    children: React.ReactNode   
    className?: string
}
const Container: React.FC<ContainerProps> = ({ children, className }) => {
    return(
        <div className={`w-full mx-auto px-8 max-w-[1200px] ${className}`}>
            {children}
        </div>
    )
}

export default Container;