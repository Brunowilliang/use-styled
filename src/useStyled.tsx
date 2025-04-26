import React from 'react'
import type {
	Component,
	Config,
	StyledComponent,
	ComponentProps,
	ConfigSchema,
	FinalProps,
	DebugConfig,
} from './types'

import {
	resolveVariantProps,
	resolveCompoundVariantProps,
	mergeFinalProps,
} from './utils'
import { logger } from './logger'

export const useStyled = <T extends Component, C extends Config>(
	component: T,
	config: C & DebugConfig & ConfigSchema<T, C>, // Validate the config on input
) => {
	// Create the functional component that applies the logic
	const StyledComponentInternal: React.FC<FinalProps<T, C>> = incomingProps => {
		// 1. Extract configuration
		const {
			name,
			debug,
			variants: configVariants,
			defaultVariants,
			compoundVariants: configCompoundVariants,
			base: baseProps,
		} = config

		if (debug) {
			logger.debug(name, 'Incoming Props:', incomingProps)
		}

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

		if (debug) {
			logger.debug(
				name,
				'Separated - Active Variant Props:',
				activeVariantProps,
			)
			logger.debug(name, 'Separated - Direct Props:', directProps)
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

		if (debug && defaultVariants) {
			logger.debug(
				name,
				'After Defaults - Active Variant Props:',
				activeVariantProps,
			)
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

		if (debug) {
			logger.debug(name, 'Resolved Variant Props:', variantPropsResult)
			logger.debug(
				name,
				'Resolved Compound Variant Props:',
				compoundPropsResult,
			)
		}

		// 5. Merge all props in the correct order
		const finalMergedProps = mergeFinalProps<T>(
			baseProps,
			variantPropsResult,
			compoundPropsResult,
			directProps,
		)

		if (debug) {
			logger.debug(name, 'Final Merged Props:', finalMergedProps)
		}

		// 6. Render the original component
		return React.createElement(component, finalMergedProps)
	}

	const componentName =
		config.name ||
		(typeof component === 'string'
			? component
			: (component as any).displayName ||
				(component as any).name ||
				'Component')
	StyledComponentInternal.displayName = `Styled(${componentName})`

	return StyledComponentInternal as StyledComponent<T, C>
}
