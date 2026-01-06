"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ComponentProps } from "react";

type CustomButtonProps = ComponentProps<typeof Button> & {
  loading?: boolean;
};

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ children, loading, disabled, ...props }, ref) => {
    // Helper to check if a child is likely an icon
    const isIcon = (child: React.ReactNode): boolean => {
      if (!React.isValidElement(child)) return false;
      
      const childType = child.type;
      
      // Direct SVG element
      if (typeof childType === "string" && childType === "svg") return true;
      
      // Function component - check if it's likely an icon
      if (typeof childType === "function") {
        const componentName = (childType as any).displayName || childType.name || "";
        const props = child.props as Record<string, unknown> | undefined;
        
        // Check component name patterns (Icon*, *Icon, etc.)
        const hasIconName = /Icon|icon/.test(componentName);
        
        // Icons typically:
        // - Have size, width, height, or className props
        // - Don't have children (or only have minimal children)
        // - Are function components that render SVGs
        const hasIconProps = Boolean(props && (
          props.size !== undefined ||
          props.width !== undefined ||
          props.height !== undefined ||
          props.className !== undefined
        ));
        
        const hasNoChildren = !props?.children || 
          (Array.isArray(props.children) && props.children.length === 0);
        
        // If it has an icon-like name OR (has icon props AND no children), it's likely an icon
        return hasIconName || (hasIconProps && hasNoChildren);
      }
      
      return false;
    };

    const childrenArray = React.Children.toArray(children);
    const iconIndex = childrenArray.findIndex(isIcon);
    const hasIcon = iconIndex !== -1;
    
    const content = loading ? (
      hasIcon ? (
        // Replace icon with spinner
        <>
          {childrenArray.map((child, index) => 
            index === iconIndex ? <Spinner key="spinner" /> : child
          )}
        </>
      ) : (
        // Prepend spinner
        <>
          <Spinner />
          {children}
        </>
      )
    ) : (
      children
    );

    return (
      <Button ref={ref} disabled={disabled || loading} {...props}>
        {content}
      </Button>
    );
  }
);

CustomButton.displayName = "CustomButton";

export { CustomButton };

