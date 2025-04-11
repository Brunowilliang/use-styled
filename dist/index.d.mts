import { ElementType, ComponentProps, ComponentType } from 'react';

/**
 * Extracts all valid props from a React element type.
 * This allows TypeScript to know all possible props for a component.
 * @template T - The base React element type (e.g., 'div', 'button', ComponentType).
 */
type ElementProps<T extends ElementType> = ComponentProps<T>;
/**
 * Defines a partial set of props that can be applied as a variant style.
 * Allows defining only the props to be modified for a specific variant.
 * @template T - The base React element type.
 */
type VariantValue<T extends ElementType> = Partial<ElementProps<T>>;
/**
 * Type for a regular string-keyed variant.
 */
type StringVariant<T extends ElementType> = Record<string, VariantValue<T>>;
/**
 * Defines the structure for variant configurations.
 * The first level Record keys are variant categories (e.g., "color", "size").
 * The second level keys are the possible values for that category.
 * @template T - The base React element type.
 */
type VariantsConfig<T extends ElementType> = Record<string, StringVariant<T>>;
/**
 * Extracts the possible variant keys and their allowed values from a VariantsConfig.
 * Enables TypeScript autocompletion and validation for variant props.
 * Example: If V = { color: { red, blue } }, then VariantKeys allows { color?: "red" | "blue" }.
 * @template V - The VariantsConfig object.
 */
type VariantKeys<V> = {
    [K in keyof V]?: V[K] extends Record<infer ValueKeys, unknown> ? ValueKeys extends string ? ValueKeys : never : never;
};
/**
 * Defines the conditions for a compound variant.
 * Represents the combination of variant props that must be active for the compound variant styles to apply.
 * @template V - The VariantsConfig object.
 */
type CompoundVariantConditions<V> = Partial<VariantKeys<V>>;
/**
 * Defines a compound variant, which applies styles only when specific combinations of base variants are active.
 * Combines the required conditions (CompoundVariantConditions) with the props to apply (VariantValue).
 * @template T - The base React element type.
 * @template V - The VariantsConfig object.
 */
type CompoundVariant<T extends ElementType, V> = CompoundVariantConditions<V> & VariantValue<T>;
/**
 * Configuration for a styled component with unified properties.
 * @template T - The base React element type.
 * @template V - The VariantsConfig object.
 */
type StyledConfig<T extends ElementType, V extends VariantsConfig<T> = VariantsConfig<T>> = {
    /** Component name for debugging purposes */
    name?: string;
    /** Enable debug mode to log the component's prop merging process */
    debug?: boolean;
    /** Base props to apply to the component, merged with lower priority than variants and instance props. */
    base?: Partial<ElementProps<T>>;
    /** Definitions for component variants. */
    variants?: V;
    /** Default variant values to apply if not specified in props. */
    defaultVariants?: VariantKeys<V>;
    /** Definitions for compound variants based on combinations of base variants. */
    compoundVariants?: Array<CompoundVariant<T, V>>;
};
/**
 * Props for the resulting styled component when variants ARE defined.
 * Combines the original component props with the allowed variant keys.
 * @template T - The base React element type.
 * @template V - The VariantsConfig object.
 */
type StyledPropsWithVariants<T extends ElementType, V extends VariantsConfig<T>> = ElementProps<T> & VariantKeys<V>;
/**
 * Creates a styled component factory.
 * Returns a new component type that accepts the original component's props plus the defined variant props.
 *
 * @template T - The base React element type.
 * @template V - The VariantsConfig object type.
 * @param component - The base component or tag name (e.g., 'div', Button).
 * @param config - Configuration object including variants, defaultVariants, compoundVariants, and base.
 * @returns A new React component type supporting variants.
 */
declare const useStyled: <T extends ElementType, V extends VariantsConfig<T> = VariantsConfig<T>>(component: T, config: StyledConfig<T, V>) => ComponentType<V extends undefined ? ElementProps<T> : StyledPropsWithVariants<T, V>>;

export { type CompoundVariant, type CompoundVariantConditions, type ElementProps, type StringVariant, type StyledConfig, type StyledPropsWithVariants, type VariantKeys, type VariantValue, type VariantsConfig, useStyled };
