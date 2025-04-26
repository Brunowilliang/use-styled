import '@testing-library/jest-dom'
import { test, describe, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { useStyled } from '../useStyled'
import { useSlot } from '../useSlot'

const ButtonRoot = useStyled('button', {
	variants: {
		variant: {
			primary: { className: 'btn-root-primary' },
			secondary: { className: 'btn-root-secondary' },
		},
		intent: {
			positive: { className: 'btn-root-positive' },
			negative: { className: 'btn-root-negative' },
		},
	},
})
const ButtonLeft = useStyled('div', {})
const ButtonRight = useStyled('div', {})
const ButtonLeftIcon = useStyled('div', {})
const ButtonRightIcon = useStyled('div', {})
const Teste = useStyled('div', {
	variants: {
		variant: {
			TestePrimary: { className: 'teste-primary' },
			TesteSecondary: { className: 'teste-secondary' },
		},
	},
})
const TesteIcon = useStyled('div', {
	variants: {
		variant: {
			TesteIconPrimary: { className: 'teste-icon-primary' },
			TesteIconSecondary: { className: 'teste-icon-secondary' },
		},
	},
})

const Button = useSlot({
	Root: ButtonRoot,
	Left: {
		Root: ButtonLeft,
		Icon: ButtonLeftIcon,
		Test: {
			Root: Teste,
			Icon: TesteIcon,
			Test: {
				Root: Teste,
				Icon: TesteIcon,
			},
		},
	},
	Right: {
		Root: ButtonRight,
		Icon: ButtonRightIcon,
	},
})

// Helper to check if something is a React component type (function)
function isReactComponent(component: any): boolean {
	return typeof component === 'function'
}

// --- Test Suites for useSlot ---

describe('useSlot Component Structure (Button Example)', () => {
	test('should attach slots as static properties correctly', () => {
		// Check top-level slots
		expect(isReactComponent(Button)).toBe(true)
		expect(isReactComponent(Button.Left)).toBe(true)
		expect(isReactComponent(Button.Right)).toBe(true)

		// Check nested slots
		expect(isReactComponent(Button.Left.Icon)).toBe(true)
		expect(isReactComponent(Button.Right.Icon)).toBe(true)
		expect(isReactComponent(Button.Left.Test)).toBe(true)
		expect(isReactComponent(Button.Left.Test.Icon)).toBe(true)

		// Check deeply nested slots
		expect(isReactComponent(Button.Left.Test.Test)).toBe(true)
		expect(isReactComponent(Button.Left.Test.Test.Icon)).toBe(true)
	})

	test('should set the correct displayName for the root component', () => {
		// Note: useStyled might interfere or set its own displayName later
		// We check the name derived from useSlot
		expect(Button.displayName).toContain('useSlot(') // It might be wrapped by useStyled
	})

	test('attached slots should be the correct underlying components', () => {
		// You might want to compare against the original components if needed
		// This can be complex due to HOCs like useStyled
		// Example: Check if Button.Left is derived from the original ButtonLeft
		// This test is more about type/existence than exact instance equality
		expect(Button.Left).toBeDefined()
		expect(Button.Left.Icon).toBeDefined()
		// ... add more checks if specific component identity is crucial
	})
})

describe('useSlot Component Rendering (Button Example)', () => {
	test('renders the root component correctly', () => {
		render(<Button data-testid='root-btn'>Root Button</Button>)
		const buttonElement = screen.getByTestId('root-btn')
		expect(buttonElement).toBeInTheDocument()
		expect(buttonElement.tagName).toBe('BUTTON') // Based on ButtonRoot = useStyled('button', ...)
		expect(buttonElement).toHaveTextContent('Root Button')
	})

	test('renders the root component with variants from useStyled', () => {
		// ButtonRoot uses useStyled with variants
		render(
			<Button
				data-testid='root-variant-btn'
				variant='secondary'
				intent='negative'
			>
				Variant Button
			</Button>,
		)
		const buttonElement = screen.getByTestId('root-variant-btn')
		expect(buttonElement).toBeInTheDocument()
		// Now we can check the classes from variants
		expect(buttonElement).toHaveClass('btn-root-secondary')
		expect(buttonElement).toHaveClass('btn-root-negative')
		expect(buttonElement).not.toHaveClass('btn-root-primary')
		expect(buttonElement).not.toHaveClass('btn-root-positive')
	})

	test('renders nested slot components and applies their specific variants', () => {
		render(
			<Button>
				{/* Button.Left doesn't have variants defined in useSlot.tsx */}
				<Button.Left data-testid='left-slot'>
					{/* Button.Left.Icon doesn't have variants */}
					<Button.Left.Icon data-testid='left-icon' />

					{/* Teste component used as Button.Left.Test, passing variant */}
					<Button.Left.Test data-testid='test-slot' variant='TestePrimary'>
						{/* TesteIcon used as Button.Left.Test.Icon, passing variant */}
						<Button.Left.Test.Icon
							data-testid='test-icon'
							variant='TesteIconSecondary'
						/>
						{/* Deeply nested Teste component */}
						<Button.Left.Test.Test
							data-testid='test-test-slot'
							variant='TesteSecondary'
						>
							{/* Deeply nested TesteIcon component */}
							<Button.Left.Test.Test.Icon
								data-testid='test-test-icon'
								variant='TesteIconPrimary'
							/>
						</Button.Left.Test.Test>
					</Button.Left.Test>
				</Button.Left>
				Main Content
				{/* Button.Right and Button.Right.Icon don't have variants */}
				<Button.Right data-testid='right-slot'>
					<Button.Right.Icon data-testid='right-icon' />
				</Button.Right>
			</Button>,
		)

		// Check if slots rendered (as before)
		expect(screen.getByTestId('left-slot')).toBeInTheDocument()
		expect(screen.getByTestId('left-icon')).toBeInTheDocument()
		expect(screen.getByTestId('right-slot')).toBeInTheDocument()
		expect(screen.getByTestId('right-icon')).toBeInTheDocument()
		expect(screen.getByTestId('test-slot')).toBeInTheDocument()
		expect(screen.getByTestId('test-icon')).toBeInTheDocument()
		expect(screen.getByTestId('test-test-slot')).toBeInTheDocument()
		expect(screen.getByTestId('test-test-icon')).toBeInTheDocument()
		expect(screen.getByText('Main Content')).toBeInTheDocument()

		// Check specific variant classes on slots that have them
		const testSlot = screen.getByTestId('test-slot')
		expect(testSlot).toHaveClass('teste-primary')
		expect(testSlot).not.toHaveClass('teste-secondary')

		const testIcon = screen.getByTestId('test-icon')
		expect(testIcon).toHaveClass('teste-icon-secondary')
		expect(testIcon).not.toHaveClass('teste-icon-primary')

		const testTestSlot = screen.getByTestId('test-test-slot')
		expect(testTestSlot).toHaveClass('teste-secondary')
		expect(testTestSlot).not.toHaveClass('teste-primary')

		const testTestIcon = screen.getByTestId('test-test-icon')
		expect(testTestIcon).toHaveClass('teste-icon-primary')
		expect(testTestIcon).not.toHaveClass('teste-icon-secondary')
	})
})

// --- Original Test Suite (can be kept or removed) ---

describe('Original Test Example', () => {
	test('renders a button with the correct class and style', () => {
		render(
			<button
				data-testid='original-button'
				className='my-button bg-red-500'
				style={{ backgroundColor: 'red', color: 'white' }}
			>
				Click Me
			</button>,
		)
		const buttonElement = screen.getByTestId('original-button')
		expect(buttonElement).toHaveClass('my-button')
		expect(buttonElement).toHaveClass('bg-red-500')
		expect(buttonElement).toHaveStyle({
			color: 'white',
			backgroundColor: 'red',
		})
	})
})
