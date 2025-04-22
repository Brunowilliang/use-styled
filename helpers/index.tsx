import React from 'react'
import type {
	Component,
	Config,
	StyledComponent,
	ComponentProps,
	ConfigSchema,
	FinalProps,
} from './types'

import {
	resolveVariantProps,
	resolveCompoundVariantProps,
	mergeFinalProps,
} from './utils'

export const useStyled = <T extends Component, C extends Config>(
	component: T,
	config: C & ConfigSchema<T, C>, // Validate the config on input
) => {
	// Create the functional component that applies the logic
	const StyledComponentInternal: React.FC<FinalProps<T, C>> = incomingProps => {
		// 1. Extract configuration
		const {
			variants: configVariants,
			defaultVariants,
			compoundVariants: configCompoundVariants,
			base: baseProps,
		} = config

		// 2. Separate incoming props: variants vs. direct props (including ref)
		const variantKeys = configVariants ? Object.keys(configVariants) : []
		const activeVariantProps: Record<string, string | boolean | undefined> = {}
		const directProps: Partial<ComponentProps<T>> = {} // Props passed directly in JSX

		for (const key in incomingProps) {
			const incomingKey = key as keyof typeof incomingProps
			const propValue = incomingProps[incomingKey]
			if (variantKeys.includes(key) && propValue !== undefined) {
				activeVariantProps[key] = propValue
			} else {
				directProps[incomingKey as keyof typeof directProps] = propValue as any
			}
		}

		// 3. Apply defaultVariants
		if (defaultVariants) {
			for (const key in defaultVariants) {
				if (activeVariantProps[key] === undefined) {
					activeVariantProps[key] =
						defaultVariants[key as keyof typeof defaultVariants]
				}
			}
		}

		// 4. Resolve props from variants and compound variants
		const variantPropsResult = resolveVariantProps<T, C>(
			configVariants,
			activeVariantProps,
		)
		const compoundPropsResult = resolveCompoundVariantProps<T, C>(
			configCompoundVariants,
			activeVariantProps,
		)

		// 5. Merge all props in the correct order
		const finalMergedProps = mergeFinalProps<T>(
			baseProps,
			variantPropsResult,
			compoundPropsResult,
			directProps,
		)

		// 6. Render the original component
		return React.createElement(component, finalMergedProps)
	}

	const componentName =
		typeof component === 'string'
			? component
			: (component as any).displayName || (component as any).name || 'Component'
	StyledComponentInternal.displayName = `Styled(${componentName})`

	return StyledComponentInternal as StyledComponent<T, C>
}
