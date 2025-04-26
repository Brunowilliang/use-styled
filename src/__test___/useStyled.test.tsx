import React from 'react'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'bun:test'
import { useStyled } from '../useStyled'
import type { ComponentProps } from 'react'

// VERY simple base component (no forwardRef)
const SimpleButton = (props: ComponentProps<'button'>) => {
	return <button {...props} />
}

// Create the styled component with the complete config
const StyledButton = useStyled(SimpleButton, {
	base: {
		style: { cursor: 'pointer', border: 'none' },
		className: 'base-btn',
		'data-testid': 'styled-button-test',
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
		// Disabled variant re-added
		disabled: {
			true: { style: { opacity: 0.5 }, className: 'btn-disabled' },
			// We could add `false` if needed, but not required for the current test
		},
	},
	// Default variants re-added
	defaultVariants: {
		color: 'primary',
		size: 'md',
	},
	// Compound variants re-added
	compoundVariants: [
		{
			color: 'primary',
			disabled: true,
			props: {
				style: { backgroundColor: 'darkblue' },
				className: 'btn-primary-disabled',
			},
		},
	],
})

// Test 1: Base, variant, and direct props application
test('useStyled applies base, variant, and direct props correctly', () => {
	render(
		<StyledButton
			color='secondary' // Overrides default
			size='sm' // Overrides default
			// Does not pass 'disabled', so it should be false (does not apply disabled style)
			className='extra-class' // Add direct class
			id='my-button' // Direct prop
		/>,
	)
	const buttonElement = screen.getByTestId('styled-button-test')

	// Check attributes
	expect(buttonElement).toHaveAttribute('id', 'my-button')

	// Check classes: base + variant(secondary) + variant(sm) + direct
	expect(buttonElement).toHaveClass(
		'base-btn',
		'btn-secondary',
		'btn-sm',
		'extra-class',
	)
	// Ensure no unexpected classes (optional, but good practice)
	expect(buttonElement.classList.length).toBe(4)

	// Check styles: base + correct variant styles
	expect(buttonElement).toHaveStyle({
		cursor: 'pointer',
		border: 'none', // Note: jest-dom checks computed style, might differ slightly for border
		backgroundColor: 'gray', // from secondary
		color: 'black', // from secondary
		padding: '4px 8px', // from sm
		fontSize: '12px', // from sm
	})
	// Check that disabled style is NOT applied
	expect(buttonElement).not.toHaveStyle({ opacity: '0.5' })
})

// Test 2: Default variants application
test('useStyled applies default variants', () => {
	render(<StyledButton />) // No variant props passed
	const buttonElement = screen.getByTestId('styled-button-test')

	// Check classes: base + default(primary) + default(md)
	expect(buttonElement).toHaveClass('base-btn', 'btn-primary', 'btn-md')
	expect(buttonElement.classList.length).toBe(3)

	// Check default styles
	expect(buttonElement).toHaveStyle({
		cursor: 'pointer', // base
		border: 'none', // base
		backgroundColor: 'blue', // from primary
		color: 'white', // from primary
		padding: '8px 16px', // from md
		fontSize: '16px', // from md
	})
	expect(buttonElement).not.toHaveStyle({ opacity: '0.5' }) // Check disabled style is not applied
})

// Test 3: Compound variants application
test('useStyled applies compound variants correctly', () => {
	render(
		<StyledButton
			data-testid='styled-button-test'
			disabled={true}
			color='primary'
		/>,
	) // Activates compound (size uses default 'md')
	const buttonElement = screen.getByTestId('styled-button-test')

	// Check classes: base + variant(primary) + variant(md-default) + variant(disabled) + compound
	expect(buttonElement).toHaveClass(
		'base-btn',
		'btn-primary',
		'btn-md',
		'btn-disabled',
		'btn-primary-disabled',
	)
	expect(buttonElement.classList.length).toBe(5)

	// Check styles: base + variant(primary/md/disabled) + compound (overrides bg)
	expect(buttonElement).toHaveStyle({
		cursor: 'pointer',
		border: 'none',
		backgroundColor: 'darkblue', // from compound
		color: 'white', // from primary (not overridden)
		padding: '8px 16px', // from md default
		fontSize: '16px', // from md default
		opacity: '0.5', // from disabled variant
	})
})

// Test 4: Ref (no change needed for jest-dom, assertion is about not throwing)
test('useStyled allows passing ref prop', () => {
	const ref = React.createRef<HTMLButtonElement>()
	expect(() => render(<StyledButton ref={ref} />)).not.toThrow()
})

// Test 5: Native tag
test('useStyled works with native HTML tag string', () => {
	const StyledDiv = useStyled('div', {
		base: {
			style: { border: '1px solid red' },
			className: 'base-div',
			id: 'styled-div',
		},
		variants: {
			padding: {
				normal: { style: { padding: '10px' }, className: 'p-normal' },
				large: { style: { padding: '20px' }, className: 'p-large' },
			},
		},
		defaultVariants: { padding: 'normal' },
	})

	const { container } = render(
		<StyledDiv padding='large' className='extra-div'>
			My Content
		</StyledDiv>,
	)
	// Using querySelector for direct child check, but could use getByTestId if you add it to base
	const divElement = container.querySelector('#styled-div')
	expect(divElement).toBeInTheDocument() // Check if element exists
	expect(divElement).toBeInstanceOf(HTMLDivElement) // Check element type
	expect(divElement).toHaveAttribute('id', 'styled-div')
	expect(divElement).toHaveTextContent('My Content') // Check content

	// Check classes
	expect(divElement).toHaveClass('base-div', 'p-large', 'extra-div')
	expect(divElement?.classList.length).toBe(3)

	// Check styles
	expect(divElement).toHaveStyle({
		border: '1px solid red',
		padding: '20px', // from large variant
	})
})
