import React from 'react'
import '@testing-library/jest-dom'
import { test, describe, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { useStyled } from '../useStyled'
import { useSlot } from '../useSlot'

// Basic components for testing
const BaseButton = useStyled('button', {
	base: { className: 'base-button' },
	variants: {
		variant: {
			primary: { className: 'btn-primary' },
			secondary: { className: 'btn-secondary' },
		},
	},
})

const BaseDiv = useStyled('div', {
	base: { className: 'base-div' },
})

const BaseIcon = useStyled('span', {
	base: { className: 'icon' },
	variants: {
		size: {
			sm: { className: 'icon-sm' },
			lg: { className: 'icon-lg' },
		},
	},
})

describe('useSlot', () => {
	describe('Basic Functionality', () => {
		test('should attach static properties to a component', () => {
			const ButtonWithIcon = useSlot(BaseButton, {
				Icon: BaseIcon,
			})

			expect(ButtonWithIcon.Icon).toBeDefined()
			expect(typeof ButtonWithIcon.Icon).toBe('function')
		})

		test('should preserve original component functionality', () => {
			const ButtonWithIcon = useSlot(BaseButton, {
				Icon: BaseIcon,
			})

			render(
				<ButtonWithIcon data-testid='button' variant='primary'>
					Test Button
				</ButtonWithIcon>,
			)

			const button = screen.getByTestId('button')
			expect(button).toBeInTheDocument()
			expect(button.tagName).toBe('BUTTON')
			expect(button).toHaveClass('base-button', 'btn-primary')
			expect(button).toHaveTextContent('Test Button')
		})

		test('should render attached slot components', () => {
			const ButtonWithIcon = useSlot(BaseButton, {
				Icon: BaseIcon,
			})

			render(
				<div>
					<ButtonWithIcon data-testid='button'>Button</ButtonWithIcon>
					<ButtonWithIcon.Icon data-testid='icon' size='lg' />
				</div>,
			)

			const button = screen.getByTestId('button')
			const icon = screen.getByTestId('icon')

			expect(button).toBeInTheDocument()
			expect(icon).toBeInTheDocument()
			expect(icon).toHaveClass('icon', 'icon-lg')
		})
	})

	describe('Nested Slots', () => {
		test('should support multiple levels of slot nesting', () => {
			// Create nested structure: Button -> Left -> Icon
			const ButtonLeft = useSlot(BaseDiv, {
				Icon: BaseIcon,
			})

			const Button = useSlot(BaseButton, {
				Left: ButtonLeft,
			})

			expect(Button.Left).toBeDefined()
			expect(Button.Left.Icon).toBeDefined()
		})

		test('should render nested slot components correctly', () => {
			const ButtonLeft = useSlot(BaseDiv, {
				Icon: BaseIcon,
			})

			const Button = useSlot(BaseButton, {
				Left: ButtonLeft,
			})

			render(
				<Button data-testid='button'>
					<Button.Left data-testid='left'>
						<Button.Left.Icon data-testid='icon' size='sm' />
						Left Content
					</Button.Left>
					Button Content
				</Button>,
			)

			expect(screen.getByTestId('button')).toBeInTheDocument()
			expect(screen.getByTestId('left')).toBeInTheDocument()
			expect(screen.getByTestId('icon')).toBeInTheDocument()
			expect(screen.getByTestId('icon')).toHaveClass('icon', 'icon-sm')
		})
	})

	describe('Component Cloning', () => {
		test('should clone component when already decorated', () => {
			// First decoration
			const ButtonWithIcon = useSlot(BaseButton, {
				Icon: BaseIcon,
			})

			// Second decoration (should trigger cloning)
			const ButtonWithIconAndText = useSlot(ButtonWithIcon, {
				Text: BaseDiv,
			})

			expect(ButtonWithIconAndText.Icon).toBeDefined()
			expect(ButtonWithIconAndText.Text).toBeDefined()
		})

		test('should preserve existing slots when cloning', () => {
			const ButtonWithIcon = useSlot(BaseButton, {
				Icon: BaseIcon,
			})

			const ButtonWithIconAndText = useSlot(ButtonWithIcon, {
				Text: BaseDiv,
			})

			render(
				<div>
					<ButtonWithIconAndText data-testid='button'>
						Button
					</ButtonWithIconAndText>
					<ButtonWithIconAndText.Icon data-testid='icon' />
					<ButtonWithIconAndText.Text data-testid='text'>
						Text
					</ButtonWithIconAndText.Text>
				</div>,
			)

			expect(screen.getByTestId('button')).toBeInTheDocument()
			expect(screen.getByTestId('icon')).toBeInTheDocument()
			expect(screen.getByTestId('text')).toBeInTheDocument()
		})
	})

	describe('Multiple Slots', () => {
		test('should attach multiple slots to a single component', () => {
			const ComplexButton = useSlot(BaseButton, {
				Icon: BaseIcon,
				Left: BaseDiv,
				Right: BaseDiv,
			})

			expect(ComplexButton.Icon).toBeDefined()
			expect(ComplexButton.Left).toBeDefined()
			expect(ComplexButton.Right).toBeDefined()
		})

		test('should render all attached slots', () => {
			const ComplexButton = useSlot(BaseButton, {
				Icon: BaseIcon,
				Left: BaseDiv,
				Right: BaseDiv,
			})

			render(
				<div>
					<ComplexButton data-testid='button'>Main</ComplexButton>
					<ComplexButton.Icon data-testid='icon' />
					<ComplexButton.Left data-testid='left'>Left</ComplexButton.Left>
					<ComplexButton.Right data-testid='right'>Right</ComplexButton.Right>
				</div>,
			)

			expect(screen.getByTestId('button')).toBeInTheDocument()
			expect(screen.getByTestId('icon')).toBeInTheDocument()
			expect(screen.getByTestId('left')).toBeInTheDocument()
			expect(screen.getByTestId('right')).toBeInTheDocument()
		})
	})

	describe('Component Properties', () => {
		test('should maintain component displayName', () => {
			const ButtonWithIcon = useSlot(BaseButton, {
				Icon: BaseIcon,
			})

			// useStyled sets displayName as 'Styled(button)'
			expect(ButtonWithIcon.displayName).toBe('Styled(button)')
		})

		test('should work as React components', () => {
			const ButtonWithIcon = useSlot(BaseButton, {
				Icon: BaseIcon,
			})

			// Test that they can be rendered without errors
			expect(() => {
				render(
					<div>
						<ButtonWithIcon>Test</ButtonWithIcon>
						<ButtonWithIcon.Icon />
					</div>,
				)
			}).not.toThrow()
		})
	})

	describe('Edge Cases', () => {
		test('should handle empty slots object', () => {
			const ButtonWithNoSlots = useSlot(BaseButton, {})

			render(<ButtonWithNoSlots data-testid='button'>Test</ButtonWithNoSlots>)

			expect(screen.getByTestId('button')).toBeInTheDocument()
		})

		test('should handle components with existing static properties', () => {
			// Add a static property to the base component
			;(BaseButton as any).existingProp = 'existing'

			const ButtonWithIcon = useSlot(BaseButton, {
				Icon: BaseIcon,
			})

			expect((ButtonWithIcon as any).existingProp).toBe('existing')
			expect(ButtonWithIcon.Icon).toBeDefined()
		})
	})

	describe('Integration with useStyled', () => {
		test('should work seamlessly with useStyled components', () => {
			const StyledButton = useStyled('button', {
				base: { className: 'styled-btn' },
				variants: {
					size: {
						sm: { className: 'btn-sm' },
						lg: { className: 'btn-lg' },
					},
				},
			})

			const ButtonWithSlots = useSlot(StyledButton, {
				Icon: BaseIcon,
			})

			render(
				<div>
					<ButtonWithSlots data-testid='button' size='lg'>
						Styled Button
					</ButtonWithSlots>
					<ButtonWithSlots.Icon data-testid='icon' size='sm' />
				</div>,
			)

			const button = screen.getByTestId('button')
			const icon = screen.getByTestId('icon')

			expect(button).toHaveClass('styled-btn', 'btn-lg')
			expect(icon).toHaveClass('icon', 'icon-sm')
		})
	})
})
