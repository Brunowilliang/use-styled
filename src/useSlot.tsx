import React from 'react'

/**
 * A unique symbol used to mark components that have been processed by `useSlot`.
 * This helps in determining if a component needs to be cloned or can be mutated directly.
 */
const Decorated = Symbol('Decorated')

/**
 * Interface for properties that can be attached to a component via `useSlot`.
 * It includes the internal `Decorated` symbol and allows for arbitrary string-keyed properties.
 */
interface DecoratedComponentProps {
	/**
	 * A flag indicating that the component has been decorated by `useSlot`.
	 */
	[Decorated]?: boolean
	/**
	 * Allows attaching any other static properties (slots) to the component.
	 */
	[key: string]: any // Para outras propriedades estáticas e Object.assign
}

/**
 * A utility type that combines two types, A and B.
 * In the context of `useSlot`, it represents the original component type `A` augmented with static properties from `B`.
 * @template A - The base type (typically a React component function).
 * @template B - The type of the static properties to be added (an object рекорд).
 */
// eslint-disable-next-line @typescript-eslint/ban-types
type Combined<A, B> = A & B

/**
 * A React hook that allows attaching static components (slots) as properties to a given component.
 *
 * This enables a compositional pattern where sub-components can be accessed as properties of a main component,
 * for example: `MainComponent.SlotComponent`.
 *
 * If the provided `component` has already been processed by `useSlot` (identified by the `Decorated` symbol),
 * it will be cloned to prevent unintended side effects on the original component. Otherwise, the original component
 * is used and modified directly.
 *
 * @template A - The type of the base component. Must be a function and extend `DecoratedComponentProps` to allow property assignment.
 * @template B - The type of the object containing the static slot components to attach.
 * @param {A} component - The base React component (e.g., a function component or a `React.forwardRef` component) to which slots will be attached.
 * @param {B} staticProps - An object where keys are slot names and values are the slot components themselves.
 * @returns {Combined<A, B>} The original component `A` augmented with the static properties from `B`.
 */
export const useSlot = <
	// eslint-disable-next-line @typescript-eslint/ban-types
	A extends Function & DecoratedComponentProps, // A is now a function with DecoratedComponentProps
	B extends object,
>(
	component: A,
	staticProps: B,
): Combined<A, B> => {
	// Clone component if it has been wrapped once already to avoid mutating the original
	// and to allow multiple `useSlot` calls on the same base component type without interference.
	const next = (() => {
		if (component[Decorated]) {
			// Component has been decorated before, so we create a new ForwardRef component
			// that wraps the original component. This acts as a clone for the purpose of attaching new slots.
			const ClonedComponent = React.forwardRef((props, ref) =>
				React.createElement(component as unknown as React.ComponentType<any>, {
					...props,
					ref,
				}),
			) as React.ForwardRefExoticComponent<any> & DecoratedComponentProps // Type assertion for the cloned component

			// Copy existing static properties from the original component to the new cloned component.
			// This ensures that previously attached slots or other static members are preserved.
			for (const key in component) {
				if (Object.prototype.hasOwnProperty.call(component, key)) {
					const value = component[key]
					// Shallow copy objects to prevent shared references for mutable properties.
					ClonedComponent[key] =
						value && typeof value === 'object' && value !== null
							? { ...value }
							: value
				}
			}
			return ClonedComponent
		}
		// If the component hasn't been decorated before, use it directly.
		return component
	})()

	// Assign the new static slot properties to the (potentially cloned) component.
	Object.assign(next, staticProps)
	// Mark the component as decorated by useSlot.
	next[Decorated] = true // Agora type-safe

	// Return the component, now augmented with the new slots.
	// The type assertion `Combined<A, B>` reflects this augmentation.
	return next as any as Combined<A, B> // A asserção original era A & B, mantendo a estrutura
}
