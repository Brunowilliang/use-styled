import '../../happydom'
import React, { type ComponentProps } from 'react'
import { Fragment } from 'react'
import { render } from '@testing-library/react'
import { bench, run } from 'mitata'
import { useStyled } from '../useStyled'
import { styled } from 'styled-components'

// --- Base Component and Configuration (Reused from tests) ---

const SimpleButton = (props: ComponentProps<'button'>) => {
	// No need for data-testid for benchmark
	return <button {...props} />
}

// Note: useStyled might need adjustment if types strictly depend on default/compound
const StyledButton = useStyled(SimpleButton, {
	base: {
		style: { cursor: 'pointer', border: 'none' },
		className: 'base-btn',
	},
	variants: {
		color: {
			primary: {
				style: { backgroundColor: 'blue', color: 'white' },
				className: 'btn-primary',
			},
			secondary: {
				style: { backgroundColor: 'gray', color: 'black' },
				className: 'btn-secondary',
			},
		},
		size: {
			sm: {
				style: { padding: '4px 8px', fontSize: '12px' },
				className: 'btn-sm',
			},
			md: {
				style: { padding: '8px 16px', fontSize: '16px' },
				className: 'btn-md',
			},
		},
		// Removed disabled to simplify direct comparison with styled-components
	},
	// Removed defaultVariants and compoundVariants
})

// --- SIMPLIFIED styled-components Definition ---

type StyledComponentPropsSimple = {
	color?: 'primary' | 'secondary'
	size?: 'sm' | 'md'
} & ComponentProps<'button'>

const StyledComponentsButton = styled(SimpleButton)<StyledComponentPropsSimple>`
	/* Base styles */
	cursor: pointer;
	border: none;

	/* Variant styles */
	background-color: ${props => (props.color === 'secondary' ? 'gray' : 'blue')};
	color: ${props => (props.color === 'secondary' ? 'black' : 'white')};
	padding: ${props => (props.size === 'sm' ? '4px 8px' : '8px 16px')};
	font-size: ${props => (props.size === 'sm' ? '12px' : '16px')};

	/* Disabled and compound logic removed for fair comparison */
`

// --- Benchmarks with mitata (no suite) ---

const RENDER_COUNT = 1000

// Benchmark for SimpleButton
bench('<SimpleButton>', () => {
	render(
		<Fragment>
			{Array.from({ length: RENDER_COUNT }).map((_, i) => (
				<SimpleButton key={String(i)}>{`Button ${i}`}</SimpleButton>
			))}
		</Fragment>,
	)
})

// Modified to use FIXED props
bench('<StyledButton (useStyled - Fixed Props)>', () => {
	render(
		<Fragment>
			{Array.from({ length: RENDER_COUNT }).map((_, i) => (
				<StyledButton
					key={String(i)}
					color='primary'
					size='sm'
				>{`Button ${i}`}</StyledButton>
			))}
		</Fragment>,
	)
})

// Modified to use FIXED props
bench('<StyledComponentsButton (Fixed Props)>', () => {
	render(
		<Fragment>
			{Array.from({ length: RENDER_COUNT }).map((_, i) => (
				<StyledComponentsButton
					key={String(i)}
					color='primary'
					size='sm'
				>{`Button ${i}`}</StyledComponentsButton>
			))}
		</Fragment>,
	)
})

// Run the defined benchmarks
run()
