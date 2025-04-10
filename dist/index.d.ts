import type { ElementType, ComponentProps, ComponentType } from "react";
/**
 * Extracts all valid props from a React element type.
 * This allows TypeScript to know all possible props for a component.
 * @template T - The base React element type (e.g., 'div', 'button', ComponentType).
 */
export type ElementProps<T extends ElementType> = ComponentProps<T>;
/**
 * Defines a partial set of props that can be applied as a variant style.
 * Allows defining only the props to be modified for a specific variant.
 * @template T - The base React element type.
 */
export type VariantValue<T extends ElementType> = Partial<ElementProps<T>>;
/**
 * Type for a boolean variant that only accepts the literal boolean value `true` as a key.
 * This helps enforce proper boolean variant usage.
 */
export type BooleanVariant<T extends ElementType> = {
    true: VariantValue<T>;
};
/**
 * Type for a regular string-keyed variant.
 */
export type StringVariant<T extends ElementType> = Record<string, VariantValue<T>>;
/**
 * Defines the structure for variant configurations.
 * The first level Record keys are variant categories (e.g., "color", "size").
 * The second level keys are the possible values for that category.
 * For boolean variants, only the literal value `true` should be used as a key.
 * @template T - The base React element type.
 */
export type VariantsConfig<T extends ElementType> = Record<string, StringVariant<T> | BooleanVariant<T>>;
/**
 * Extracts the possible variant keys and their allowed values from a VariantsConfig.
 * Enables TypeScript autocompletion and validation for variant props.
 * Example: If V = { color: { red, blue } }, then VariantKeys allows { color?: "red" | "blue" }.
 * For boolean variants (those with only 'true' key), allows using just the prop name as boolean.
 * @template V - The VariantsConfig object.
 */
export type VariantKeys<V> = V extends VariantsConfig<any> ? {
    [K in keyof V]?: keyof V[K] extends "true" ? boolean : keyof V[K];
} : {};
/**
 * Defines the conditions for a compound variant.
 * Represents the combination of variant props that must be active for the compound variant styles to apply.
 * @template V - The VariantsConfig object.
 */
export type CompoundVariantConditions<V> = VariantKeys<V>;
/**
 * Defines a compound variant, which applies styles only when specific combinations of base variants are active.
 * Combines the required conditions (CompoundVariantConditions) with the props to apply (VariantValue).
 * @template T - The base React element type.
 * @template V - The VariantsConfig object.
 */
export type CompoundVariant<T extends ElementType, V extends VariantsConfig<T>> = CompoundVariantConditions<V> & VariantValue<T>;
/**
 * Base configuration options applicable whether variants are present or not.
 * @template T - The base React element type.
 */
type BaseStyledConfig<T extends ElementType> = {
    /** Base props to apply to the component, merged with lower priority than variants and instance props. */
    base?: Partial<ElementProps<T>>;
    /** Component name for debugging purposes */
    name?: string;
    /** Enable debug mode to log the component's prop merging process */
    debug?: boolean;
};
/**
 * Configuration for a styled component WITHOUT variants.
 * Extends BaseStyledConfig.
 * @template T - The base React element type.
 */
export type StyledConfigWithoutVariants<T extends ElementType> = BaseStyledConfig<T>;
/**
 * Configuration for a styled component WITH variants.
 * Extends BaseStyledConfig and requires a 'variants' definition.
 * Optionally accepts 'defaultVariants' and 'compoundVariants'.
 * @template T - The base React element type.
 * @template V - The VariantsConfig object.
 */
export type StyledConfigWithVariants<T extends ElementType, V extends VariantsConfig<T>> = BaseStyledConfig<T> & {
    /** Definitions for component variants. */
    variants: V;
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
export type StyledPropsWithVariants<T extends ElementType, V extends VariantsConfig<T>> = ElementProps<T> & VariantKeys<V>;
/**
 * Creates a styled component factory.
 * OVERLOAD 1: For components WITHOUT variants.
 * Returns a new component type that accepts the original component's props.
 *
 * @template T - The base React element type.
 * @param component - The base component or tag name (e.g., 'div', Button).
 * @param config - Configuration object without variants (base only).
 * @returns A new React component type.
 */
export declare function useStyled<T extends ElementType>(component: T, config: StyledConfigWithoutVariants<T>): ComponentType<ElementProps<T>>;
/**
 * Creates a styled component factory.
 * OVERLOAD 2: For components WITH variants.
 * Returns a new component type that accepts the original component's props plus the defined variant props.
 *
 * @template T - The base React element type.
 * @template V - The VariantsConfig object type.
 * @param component - The base component or tag name (e.g., 'div', Button).
 * @param config - Configuration object including variants, defaultVariants, compoundVariants, and base.
 * @returns A new React component type supporting variants.
 */
export declare function useStyled<T extends ElementType, V extends VariantsConfig<T> = VariantsConfig<T>>(component: T, config: StyledConfigWithVariants<T, V>): ComponentType<StyledPropsWithVariants<T, V>>;
export {};
