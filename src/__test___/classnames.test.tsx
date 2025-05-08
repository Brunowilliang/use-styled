import React from 'react'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'bun:test'
import { useStyled } from '../useStyled'

const Text = useStyled('p', {
	name: 'Text',
	debug: true,
	base: {
		className: 'tracking-wider text-red-500',
	},
	variants: {
		size: {
			h1: { className: 'text-h1' },
			h2: { className: 'text-h2' },
			h3: { className: 'text-h3' },
			h4: { className: 'text-h4' },
			h5: { className: 'text-h5' },
			h6: { className: 'text-h6' },
		},
		h1: { true: { className: 'text-h1' } },
		h2: { true: { className: 'text-h2' } },
		h3: { true: { className: 'text-h3' } },
		h4: { true: { className: 'text-h4' } },
		h5: { true: { className: 'text-h5' } },
		h6: { true: { className: 'text-h6' } },
		align: {
			center: { className: 'text-center' },
			right: { className: 'text-right' },
			left: { className: 'text-left' },
		},
		weight: {
			bold: { className: 'font-degular-bold' },
			semibold: { className: 'font-degular-semibold' },
			medium: { className: 'font-degular-medium' },
			regular: { className: 'font-degular-regular' },
		},
	},
	defaultVariants: {
		weight: 'regular',
		h4: true,
		size: 'h4',
	},
})

// Test 1: Base, variant, and direct props application
test('Teste 1', () => {
	render(
		<Text size='h2' className='text-red-500'>
			Test
		</Text>,
	)
	const element = screen.getByText('Test')
	expect(element).toHaveClass(
		'tracking-wider text-red-500 font-degular-regular text-h2',
	)
})

test('Teste 2', () => {
	render(
		<Text h1 className='text-red-500'>
			Test
		</Text>,
	)
	const element = screen.getByText('Test')
	expect(element).toHaveClass(
		'tracking-wider text-red-500 font-degular-regular text-h1',
	)
})

test('Teste 3', () => {
	render(<Text className='text-red-500'>Test</Text>)
	const element = screen.getByText('Test')
	expect(element).toHaveClass(
		'tracking-wider text-red-500 font-degular-regular text-h4',
	)
})
