import type { ButtonHTMLAttributes, FC } from "react";

interface FilterToggleButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    active?: boolean;
    text?: string;
    activeText?: string;
}

export const FilterToggleButton: FC<FilterToggleButtonProps> = ({ active = false, text = "Filtros", activeText = "Ocultar filtros", className = "", ...props }) => (
    <button
        type="button"
        aria-expanded={active}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-black bg-transparent border-gray-300 hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${className}`}
        {...props}
    >
        <span aria-hidden="true">{active ? "−" : "+"}</span>
        {active ? activeText : text}
    </button>
);

export default FilterToggleButton;
