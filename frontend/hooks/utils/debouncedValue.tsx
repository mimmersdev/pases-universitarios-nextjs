import { useEffect, useState } from "react";

interface DebouncedValueProps {
    value: string;
    onChange: (value: string) => void;
    debounce?: number;
}
const useDebouncedValue = ({ value, onChange, debounce = 200 }: DebouncedValueProps) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        setLoading(true);
        setDebouncedValue(value);
    }, [value]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(debouncedValue);
            setLoading(false);
        }, debounce);

        return () => clearTimeout(timeout);
    }, [debouncedValue]);

    return {
        debouncedValue,
        loading,
    }
}

export default useDebouncedValue;