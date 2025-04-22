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
	config: C & ConfigSchema<T, C>, // Valida a config na entrada
) => {
	// Cria o componente funcional que aplica a lógica
	const StyledComponentInternal: React.FC<FinalProps<T, C>> = incomingProps => {
		// 1. Extrai a configuração
		const {
			variants: configVariants,
			defaultVariants,
			compoundVariants: configCompoundVariants,
			base: baseProps,
		} = config

		// 2. Separa as props recebidas: variantes vs. props diretas (incluindo ref)
		const variantKeys = configVariants ? Object.keys(configVariants) : []
		const activeVariantProps: Record<string, string | boolean | undefined> = {}
		const directProps: Partial<ComponentProps<T>> = {} // Props passadas diretamente no JSX

		for (const key in incomingProps) {
			const incomingKey = key as keyof typeof incomingProps
			const propValue = incomingProps[incomingKey]
			if (variantKeys.includes(key) && propValue !== undefined) {
				activeVariantProps[key] = propValue
			} else {
				directProps[incomingKey as keyof typeof directProps] = propValue as any
			}
		}

		// 3. Aplica defaultVariants
		if (defaultVariants) {
			for (const key in defaultVariants) {
				if (activeVariantProps[key] === undefined) {
					activeVariantProps[key] =
						defaultVariants[key as keyof typeof defaultVariants]
				}
			}
		}

		// 4. Resolve as props das variantes e compound variants
		const variantPropsResult = resolveVariantProps<T, C>(
			configVariants,
			activeVariantProps,
		)
		const compoundPropsResult = resolveCompoundVariantProps<T, C>(
			configCompoundVariants,
			activeVariantProps,
		)

		// 5. Mescla todas as props na ordem correta
		const finalMergedProps = mergeFinalProps<T>(
			baseProps,
			variantPropsResult,
			compoundPropsResult,
			directProps,
		)

		// 6. Renderiza o componente original
		return React.createElement(component, finalMergedProps)
	}

	const componentName =
		typeof component === 'string'
			? component
			: (component as any).displayName || (component as any).name || 'Component'
	StyledComponentInternal.displayName = `Styled(${componentName})`

	return StyledComponentInternal as StyledComponent<T, C>
}
