import { jsx } from 'react/jsx-runtime';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

// --- Utility Functions ---
/**
 * Utility function to merge CSS classes with Tailwind CSS support.
 * Uses clsx for conditional classes and tailwind-merge to resolve conflicts.
 * @param inputs - Class values to combine.
 * @returns The merged class string.
 */
function cn(...inputs) {
    return twMerge(clsx(inputs));
}
/**
 * Merges multiple props objects, combining classNames and styles intelligently.
 * Later props override earlier props.
 * @param propsList - An array of prop objects to merge.
 * @returns The merged props object.
 */
function mergeProps(...propsList) {
    const result = {};
    for (const props of propsList) {
        if (!props)
            continue;
        for (const key in props) {
            // Ensure the key is a valid key of T before proceeding
            if (!Object.prototype.hasOwnProperty.call(props, key))
                continue;
            const value = props[key]; // Cast here since we know key is in props
            // Handle className merging
            if (key === "className" &&
                typeof value === "string" &&
                value // Ensure value is not empty string if needed
            ) {
                result.className = cn(result.className, value);
                // Handle style merging
            }
            else if (key === "style" &&
                typeof value === "object" &&
                value !== null &&
                typeof result.style === "object" &&
                result.style !== null) {
                // Simple style merge, last write wins for conflicting keys
                result.style = Object.assign(Object.assign({}, result.style), value);
            }
            else if (value !== undefined) {
                // Use direct assignment after ensuring key is valid
                // Cast value explicitly to T[keyof T] to resolve complex type inference issue
                result[key] = value;
            }
        }
    }
    // Cast the final result back to T
    return result;
}
/**
 * Helper function to check if a variant is a boolean variant (only has 'true' key)
 */
function isBooleanVariant(variant) {
    if (!variant || typeof variant !== "object")
        return false;
    // Check if it has exactly one key and that key is 'true'
    const keys = Object.keys(variant);
    return keys.length === 1 && keys[0] === "true";
}
// --- useStyled Implementation ---
/**
 * Actual implementation of the useStyled hook.
 * Handles both cases (with and without variants) using TypeScript overload resolution.
 * Supports boolean variants and debugging capabilities.
 * Updated for React 19 to use native ref handling instead of forwardRef.
 */
function useStyled(component, config) {
    const Tag = component;
    // Destructure config safely, checking if variants exist
    const { base = {}, // Base styles object
    name = "UnnamedStyledComponent", // Provide a default name
    variants, compoundVariants, defaultVariants, debug = false, // Default debug to false
     } = (config || {});
    const variantKeys = variants ? Object.keys(variants) : [];
    const logEvent = (event, details) => {
        if (debug) {
            const entry = Object.assign({ component: name, event: event }, (details && { details }));
            // Use console.log directly with stringify for one JSON object per line
            console.log(JSON.stringify(entry, null, 2));
        }
    };
    // --- Helper Functions within Hook Scope ---
    /**
     * Applies compound variants based on current props.
     * @param currentProps - The combined props including defaults and instance props.
     * @returns Props derived from matching compound variants.
     */
    const applyCompoundVariants = (currentProps) => {
        let compoundVariantProps = {};
        if (!compoundVariants || compoundVariants.length === 0) {
            logEvent("compound_variants_skip_empty");
            return {};
        }
        logEvent("compound_variants_start", {
            count: compoundVariants.length,
            currentPropsKeys: Object.keys(currentProps),
        });
        for (const compound of compoundVariants) {
            const { className, style } = compound, conditions = __rest(compound, ["className", "style"]);
            let isMatch = true;
            logEvent("compound_variants_check_condition", {
                conditionsKeys: Object.keys(conditions),
            });
            for (const key in conditions) {
                const conditionValue = conditions[key];
                const propValue = currentProps[key];
                logEvent("compound_variants_check_condition_value", {
                    key,
                    conditionValue,
                    propValue,
                });
                if (propValue !== conditionValue) {
                    isMatch = false;
                    logEvent("compound_variants_condition_mismatch", {
                        key,
                        conditionValue,
                        propValue,
                    });
                    break;
                }
                logEvent("compound_variants_condition_match", {
                    key,
                    conditionValue,
                    propValue,
                });
            }
            if (isMatch) {
                logEvent("compound_variants_match_found", {
                    conditionsKeys: Object.keys(conditions),
                    appliedStylesKeys: Object.keys(compound),
                });
                // Create props object from the compound variant, excluding condition keys
                const compoundSpecificProps = {};
                for (const key in compound) {
                    if (!(key in conditions)) {
                        // Assign non-condition props
                        compoundSpecificProps[key] = compound[key];
                    }
                }
                logEvent("compound_variants_apply_props", {
                    compoundSpecificPropsKeys: Object.keys(compoundSpecificProps),
                });
                compoundVariantProps = mergeProps(compoundVariantProps, 
                // Assert type here as we constructed it manually
                compoundSpecificProps);
            }
            else {
                logEvent("compound_variants_match_not_found", {
                    conditionsKeys: Object.keys(conditions),
                });
            }
        }
        logEvent("compound_variants_complete", {
            finalCompoundPropsKeys: Object.keys(compoundVariantProps),
        });
        return compoundVariantProps;
    };
    /**
     * Applies base variants (non-compound) based on props and defaults.
     * @param currentProps - The props passed to the component instance.
     * @returns Props derived from matching base variants and defaults.
     */
    const applyBaseVariants = (currentProps) => {
        let variantProps = {};
        if (!variants) {
            logEvent("base_variants_skip_empty");
            return {};
        }
        logEvent("base_variants_start", {
            count: variantKeys.length,
            variantsKeys: Object.keys(variants || {}),
            currentPropsKeys: Object.keys(currentProps),
            defaultVariantsKeys: Object.keys(defaultVariants || {}),
        });
        for (const key of variantKeys) {
            // Get the variant definition for this key
            const variantDef = variants[key];
            if (!variantDef)
                continue;
            // Check if this is a boolean variant
            const isBoolean = isBooleanVariant(variantDef);
            logEvent("base_variants_check_boolean", { key, isBoolean });
            // Get the value from props, falling back to defaultVariants
            let propValue = currentProps[key];
            defaultVariants && key in defaultVariants
                ? defaultVariants[key]
                : undefined;
            // Handle boolean variants
            if (isBoolean) {
                // For boolean variants, we only accept true boolean values
                if (propValue === true) {
                    // Convert to 'true' string for lookup
                    propValue = "true";
                    logEvent("base_variants_boolean_conversion", {
                        key,
                        originalValue: currentProps[key],
                        convertedValue: "true",
                    });
                }
                else if (propValue === false || propValue === undefined) {
                    // Skip this variant if false or undefined
                    logEvent("base_variants_boolean_skip", {
                        key,
                        value: propValue,
                    });
                    continue;
                }
                else if (propValue === "true" || propValue === "false") {
                    // Skip string 'true'/'false' for boolean variants
                    logEvent("base_variants_boolean_invalid", {
                        key,
                        value: propValue,
                    });
                    logEvent("base_variants_boolean_invalid_hint", {
                        key,
                        hint: "Use boolean value instead of string",
                    });
                    continue;
                }
            }
            // Ensure propValue is treated as string for lookup, unless it's undefined
            if (propValue !== undefined) {
                propValue = String(propValue);
            }
            // Check if propValue is valid and the corresponding style exists
            const variantStyles = variantDef[propValue];
            if (propValue !== undefined && variantStyles) {
                logEvent("base_variants_applied", {
                    key,
                    value: propValue,
                    stylesKeys: Object.keys(variantStyles),
                });
                variantProps = mergeProps(variantProps, variantStyles);
            }
            else {
                logEvent("base_variants_not_found", {
                    key,
                    lookupValue: propValue,
                });
            }
        }
        logEvent("base_variants_complete", {
            finalBasePropsKeys: Object.keys(variantProps),
        });
        return variantProps;
    };
    /**
     * Separates variant props from other direct props passed to the component.
     * @param allProps - All props passed to the component instance.
     * @returns An object containing separated variant and direct props.
     */
    const separateProps = (
    // Use unknown for initial catch-all, will be refined internally
    allProps) => {
        // Initialize with more specific partial types
        const variantProps = {};
        const directProps = {};
        logEvent("props_separation_start", {
            // Log only keys to avoid circular references in potential complex props
            inputPropKeys: Object.keys(allProps),
            variantKeys,
        });
        for (const key in allProps) {
            // Ensure the key is actually a property of allProps
            if (Object.prototype.hasOwnProperty.call(allProps, key)) {
                const value = allProps[key];
                if (variantKeys.includes(key)) {
                    // Assign safely, ensuring key is valid for VariantKeys<V>
                    // Cast the specific property assignment
                    variantProps[key] = value; // TODO: Revisit this cast if possible
                    logEvent("props_separation_variant", {
                        key,
                        value,
                    });
                }
                else {
                    // Assign safely, ensuring key is valid for the Omit type
                    // Cast the specific property assignment
                    directProps[key] = value; // TODO: Revisit this cast if possible
                    logEvent("props_separation_direct", {
                        key,
                        value,
                    });
                }
            }
        }
        logEvent("props_separation_complete", {
            separatedVariantPropsKeys: Object.keys(variantProps),
            separatedDirectPropsKeys: Object.keys(directProps),
        });
        // Return with appropriate types, removing 'as any' from the return itself
        return {
            variantProps: variantProps,
            directProps: directProps,
        };
    };
    // --- The Styled Component ---
    // No need for forwardRef in React 19 - refs are automatically forwarded
    function StyledComponent(props) {
        logEvent("render_start", { receivedPropKeys: Object.keys(props) });
        // Separate instance props from variant keys
        const { children } = props, restProps = __rest(props, ["children"]);
        const { variantProps, directProps } = separateProps(restProps);
        // Determine active variants including defaults
        const activeVariantProps = Object.assign(Object.assign({}, defaultVariants), variantProps);
        logEvent("active_variants_determined", {
            inputVariantPropsKeys: Object.keys(variantProps),
            defaultVariantsKeys: Object.keys(defaultVariants || {}),
            finalActiveVariantPropsKeys: Object.keys(activeVariantProps),
        });
        // --- Prop Merging Logic ---
        logEvent("prop_merging_start", {
            baseKeys: Object.keys(base || {}),
            directPropsKeys: Object.keys(directProps),
            activeVariantPropsKeys: Object.keys(activeVariantProps),
        });
        // Priority (lower overrides higher):
        // 1. Base props from config.base
        // 2. Props from active compound variants
        logEvent("prop_merging_apply_compound");
        const compoundVariantStyles = applyCompoundVariants(activeVariantProps);
        logEvent("prop_merging_apply_base");
        const baseVariantStyles = applyBaseVariants(activeVariantProps);
        logEvent("prop_merging_final_merge");
        const mergedProps = mergeProps(base, // 1. Base
        compoundVariantStyles, // 2. Compound Variants
        baseVariantStyles, // 3. Base Variants
        // Cast directProps to Partial as required by mergeProps
        directProps);
        // Separate className and style for potential framework specifics (e.g., React Native)
        const { className, style } = mergedProps, finalRestProps = __rest(mergedProps, ["className", "style"]);
        logEvent("prop_merging_complete", {
            // Log final pieces separately to avoid complex object stringification issues
            finalClassName: className,
            finalStyleKeys: Object.keys(style || {}),
            finalRestPropKeys: Object.keys(finalRestProps),
        });
        // Render the base component with merged props
        logEvent("render_component", {
            // Avoid logging Tag component and full props object to prevent cycles
            componentDisplayName: typeof Tag === "string" ? Tag : name, // Use name for non-string tags
            renderedClassName: className,
            renderedStyleKeys: Object.keys(style || {}),
            renderedRestPropKeys: Object.keys(finalRestProps),
        });
        return (
        // Using 'as any' here as a pragmatic solution for complex generic type issues
        // in JSX spread attributes. Although not ideal for type safety, it resolves the
        // persistent compilation error related to LibraryManagedAttributes.
        jsx(Tag, Object.assign({ className: className, style: style }, finalRestProps, { children: children })));
    }
    // Set display name for better debugging
    const componentDisplayName = typeof Tag === "string"
        ? Tag
        : Tag.displayName ||
            Tag.name ||
            "Component";
    StyledComponent.displayName = `Styled(${componentDisplayName})`;
    logEvent("hook_complete", { componentDisplayName });
    // Return the styled component
    // The cast is necessary because the implementation signature doesn't perfectly match the overloads
    return StyledComponent;
}

export { useStyled };
//# sourceMappingURL=index.mjs.map
