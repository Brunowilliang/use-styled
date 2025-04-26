import type { ComponentType, ElementType, FC } from 'react'

// --- Type Definitions ---

// Helper to check if a type is a React ComponentType
export type AnyComponentType = ComponentType<any>

type SlotDefinition = {
	Root: AnyComponentType
	[key: string]: AnyComponentType | SlotDefinition // Allows recursive nesting
}

// Utility type to handle the recursive nature of slots for the final component type
type SlotComponentType<S> = S extends AnyComponentType
	? S // It's a component
	: S extends SlotDefinition
		? // It's a nested definition, create its component type
			FC<ExtractProps<S['Root']>> & {
				[K in Exclude<keyof S, 'Root'>]: SlotComponentType<S[K]>
			}
		: never

// Extracts props, handling intrinsic elements
type ExtractProps<T> = T extends ElementType<infer P>
	? P
	: T extends ComponentType<infer P>
		? P
		: Record<string, unknown> // Fallback for complex types

// The type of the component returned by useSlot (before .create())
// Includes the Root component's props and statically attached slots (recursively).
type BaseComponent<S extends SlotDefinition> = FC<ExtractProps<S['Root']>> & {
	[K in Exclude<keyof S, 'Root'>]: SlotComponentType<S[K]>
}

// Utility to check if a value is a potential component type (function or class)
function isComponentType(value: any): value is AnyComponentType {
	return typeof value === 'function'
}

// Utility to check if a value is an object but not null or an array
function isObject(value: any): value is Record<string, any> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// --- Recursive Slot Attachment Logic ---
function attachSlotsRecursively(
	target: any, // The object to attach slots onto (BaseComponent or a nested Root)
	slotsToAttach: Record<string, AnyComponentType | SlotDefinition>,
	allSlotTypesSet: Set<AnyComponentType>,
): void {
	for (const [name, definition] of Object.entries(slotsToAttach)) {
		if (isComponentType(definition)) {
			// Direct component slot
			target[name] = definition
			allSlotTypesSet.add(definition)
		} else if (
			isObject(definition) &&
			'Root' in definition &&
			isComponentType(definition.Root)
		) {
			// Nested slot definition
			const NestedRootComponent = definition.Root
			const { Root, ...subSlots } = definition

			// Attach the nested Root component (e.g., Button.Left)
			target[name] = NestedRootComponent
			allSlotTypesSet.add(NestedRootComponent)

			// Recursively attach sub-slots to the NestedRootComponent
			attachSlotsRecursively(
				NestedRootComponent, // Attach to the nested component itself
				subSlots as Record<string, AnyComponentType | SlotDefinition>,
				allSlotTypesSet,
			)
		}
	}
}

// --- useSlot Implementation ---

/**
 * Creates a base component with static slots attached recursively.
 * Does NOT automatically forward props.
 *
 * @template S - The recursive slot definition.
 * @param {S} slots - The slot definition object.
 * @returns {BaseComponent<S>} The base component with static slots.
 */
export function useSlot<S extends SlotDefinition>(slots: S): BaseComponent<S> {
	const { Root: RootComponent, ...childSlotDefinitions } = slots

	// Define the simple Root rendering component
	const Component: FC<ExtractProps<S['Root']>> = props => {
		return <RootComponent {...props} />
	}

	// Attach slots recursively
	const allSlotTypes = new Set<AnyComponentType>() // Needed for attach, but not used further here
	attachSlotsRecursively(Component, childSlotDefinitions, allSlotTypes)

	// Assign a display name for debugging
	const rootDisplayName =
		RootComponent.displayName || RootComponent.name || 'SlotRoot'
	Component.displayName = `useSlot(${rootDisplayName})`

	// Return the component with the slots attached
	return Component as BaseComponent<S>
}
