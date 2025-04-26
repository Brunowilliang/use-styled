import { expect, test } from 'bun:test'
import {
	cn,
	mergeStyles,
	resolveVariantProps,
	resolveCompoundVariantProps,
	mergeFinalProps,
} from '../utils'

test('cn should merge class names correctly', () => {
	// Basic test
	expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')

	// Test with conditional (falsy) values
	expect(cn('base', null, 'conditional', false && 'ignored')).toBe(
		'base conditional',
	)

	// Test with tailwind-merge (conflicting classes)
	expect(cn('p-4', 'p-2')).toBe('p-2')
	expect(cn('px-4', 'p-2')).toBe('p-2') // p-2 overrides px-4
	expect(cn('p-2', 'px-4')).toBe('p-2 px-4')

	// Test with object
	expect(cn({ 'bg-blue-500': true, 'text-gray-200': false }, 'extra')).toBe(
		'bg-blue-500 extra',
	)

	// Test returning undefined for empty or only falsy input
	expect(cn()).toBeUndefined()
	expect(cn(null, false, undefined)).toBeUndefined()
})

// Tests for mergeStyles
test('mergeStyles should merge style objects correctly', () => {
	// Basic merge test
	expect(mergeStyles({ color: 'red' }, { fontSize: 16 })).toEqual({
		color: 'red',
		fontSize: 16,
	})

	// Override test
	expect(mergeStyles({ color: 'red', margin: 5 }, { color: 'blue' })).toEqual({
		color: 'blue',
		margin: 5,
	})

	// Test with null/undefined values in between
	expect(
		mergeStyles({ color: 'red' }, null, { fontSize: 16 }, undefined, {
			fontWeight: 'bold',
		}),
	).toEqual({ color: 'red', fontSize: 16, fontWeight: 'bold' })

	// Test returning the only valid object
	expect(mergeStyles(null, undefined, { padding: 10 })).toEqual({ padding: 10 })

	// Test returning undefined if no valid styles are passed
	expect(mergeStyles(null, undefined)).toBeUndefined()

	// Test returning undefined if merge results in empty object (though unlikely with literal objects)
	// More realistic scenario would be with pre-filtered objects
	expect(mergeStyles({}, {})).toBeUndefined() // Assumes empty objects are filtered out or result in undefined

	// Test with multiple objects
	expect(mergeStyles({ a: 1 }, { b: 2 }, { c: 3 })).toEqual({
		a: 1,
		b: 2,
		c: 3,
	})

	// Test with multiple overrides
	expect(mergeStyles({ a: 1, b: 1 }, { b: 2, c: 2 }, { c: 3 })).toEqual({
		a: 1,
		b: 2,
		c: 3,
	})
})

// Tests for resolveVariantProps
test('resolveVariantProps should resolve props from active variants', () => {
	const configVariants = {
		size: {
			sm: { padding: 4, fontSize: 12 },
			md: { padding: 8, fontSize: 16 },
		},
		color: {
			primary: { backgroundColor: 'blue', color: 'white' },
			secondary: { backgroundColor: 'gray', color: 'black' },
		},
		disabled: {
			true: { opacity: 0.5, pointerEvents: 'none' },
		},
	}

	// Basic test
	expect(resolveVariantProps(configVariants, { size: 'sm' })).toEqual({
		padding: 4,
		fontSize: 12,
	})

	// Test with multiple variants
	expect(
		resolveVariantProps(configVariants, { size: 'md', color: 'primary' }),
	).toEqual({
		padding: 8,
		fontSize: 16,
		backgroundColor: 'blue',
		color: 'white',
	})

	// Test with boolean variant
	expect(
		resolveVariantProps(configVariants, { disabled: true, color: 'secondary' }),
	).toEqual({
		opacity: 0.5,
		pointerEvents: 'none',
		backgroundColor: 'gray',
		color: 'black',
	})

	// Test with undefined variant or non-existent value
	expect(resolveVariantProps(configVariants, { size: 'lg' })).toEqual({}) // size 'lg' does not exist
	expect(resolveVariantProps(configVariants, { theme: 'dark' })).toEqual({}) // theme is not a configured variant

	// Test with undefined value in active variant
	expect(
		resolveVariantProps(configVariants, { size: undefined, color: 'primary' }),
	).toEqual({ backgroundColor: 'blue', color: 'white' })

	// Test without variants config
	expect(resolveVariantProps(undefined, { size: 'sm' })).toEqual({})

	// Test with active variant but no config for it
	const limitedConfig = { color: configVariants.color }
	expect(
		resolveVariantProps(limitedConfig, { size: 'sm', color: 'primary' }),
	).toEqual({ backgroundColor: 'blue', color: 'white' })
})

// Tests for resolveCompoundVariantProps
test('resolveCompoundVariantProps should resolve props from matching compound variants', () => {
	const compoundVariantsConfig = [
		{
			size: 'sm',
			color: 'primary',
			props: { textDecoration: 'underline' },
		},
		{
			color: 'secondary',
			disabled: true,
			props: { cursor: 'not-allowed' },
		},
		{
			// No props, just conditions (valid case, but doesn't return props)
			size: 'md',
			color: 'primary',
		},
	]

	// Test matching the first compound variant
	expect(
		resolveCompoundVariantProps(compoundVariantsConfig, {
			size: 'sm',
			color: 'primary',
			disabled: false,
		}),
	).toEqual({ textDecoration: 'underline' })

	// Test matching the second compound variant
	expect(
		resolveCompoundVariantProps(compoundVariantsConfig, {
			size: 'md',
			color: 'secondary',
			disabled: true,
		}),
	).toEqual({ cursor: 'not-allowed' })

	// Test matching both (but should it take the last match or merge? Current function merges)
	// In this case, the current function will iterate and merge. If the condition (size:'sm', color:'primary') is met AND (color:'secondary', disabled:true) is met
	// which is impossible with these active variants, but if it were possible, it would merge. Let's test a case where no variant matches.

	// Test where no compound variant condition is met
	expect(
		resolveCompoundVariantProps(compoundVariantsConfig, {
			size: 'lg',
			color: 'primary',
			disabled: false,
		}),
	).toEqual({})
	expect(
		resolveCompoundVariantProps(compoundVariantsConfig, {
			size: 'sm',
			color: 'secondary',
			disabled: false,
		}),
	).toEqual({})

	// Test where a partial condition is met, but not all
	expect(
		resolveCompoundVariantProps(compoundVariantsConfig, {
			size: 'sm',
			color: 'secondary',
		}),
	).toEqual({}) // Missing color: 'primary'

	// Test with empty config
	expect(
		resolveCompoundVariantProps([], { size: 'sm', color: 'primary' }),
	).toEqual({})

	// Test with undefined config
	expect(
		resolveCompoundVariantProps(undefined, { size: 'sm', color: 'primary' }),
	).toEqual({})

	// Test where condition matches but no props are defined
	expect(
		resolveCompoundVariantProps(compoundVariantsConfig, {
			size: 'md',
			color: 'primary',
		}),
	).toEqual({})
})

// Tests for mergeFinalProps
test('mergeFinalProps should merge props in the correct order', () => {
	const baseProps = {
		id: 'base',
		lang: 'en',
		style: { color: 'black' },
		className: 'base-class',
	}
	const variantProps = {
		'data-size': 'sm',
		style: { fontSize: 12 },
		className: 'size-sm',
	}
	const compoundProps = {
		'aria-hidden': true,
		style: { textDecoration: 'underline' },
		className: 'compound-active',
	}
	const directProps = {
		id: 'direct',
		'data-testid': 'my-comp',
		style: { color: 'red', margin: 5 },
		className: 'direct-class p-2',
		ref: { current: null },
	} // Overrides id and color

	const expectedStyle = {
		color: 'red', // from directProps
		fontSize: 12, // from variantProps
		textDecoration: 'underline', // from compoundProps
		margin: 5, // from directProps
	}

	const expectedClassName =
		'base-class size-sm compound-active direct-class p-2' // Result of cn()

	const finalProps = mergeFinalProps(
		baseProps,
		variantProps,
		compoundProps,
		directProps,
	)

	// Check normal props (without style, className, ref)
	expect(finalProps.id).toBe('direct')
	expect(finalProps.lang).toBe('en')
	expect(finalProps['data-size']).toBe('sm')
	expect(finalProps['aria-hidden']).toBe(true)
	expect(finalProps['data-testid']).toBe('my-comp')

	// Check merged style
	expect(finalProps.style).toEqual(expectedStyle)

	// Check merged className
	expect(finalProps.className).toBe(expectedClassName)

	// Check ref
	expect(finalProps.ref).toEqual({ current: null })
})

test('mergeFinalProps handles missing or empty props', () => {
	const directProps = {
		id: 'only-direct',
		style: { color: 'blue' },
		className: 'p-4',
	}

	// Only direct props
	let final = mergeFinalProps(undefined, {}, {}, directProps)
	expect(final).toEqual({
		id: 'only-direct',
		style: { color: 'blue' },
		className: 'p-4',
	})

	// Without direct props
	final = mergeFinalProps(
		{ style: { margin: 1 } },
		{ className: 'variant' },
		{},
		{},
	)
	expect(final).toEqual({ style: { margin: 1 }, className: 'variant' })

	// Without style/className
	final = mergeFinalProps({ a: 1 }, { b: 2 }, {}, { c: 3 })
	expect(final).toEqual({ a: 1, b: 2, c: 3 })
	expect(final.style).toBeUndefined()
	expect(final.className).toBeUndefined()

	// All empty or undefined (passing empty objects where undefined is not allowed by the signature)
	final = mergeFinalProps(undefined, {}, {}, {})
	expect(final).toEqual({})
})

// Test added to cover the TODO
test('mergeFinalProps handles complex prop types and functions', () => {
	const baseOnClick = () => console.log('base')
	const directOnClick = () => console.log('direct')
	const refObject = { current: 'refValue' }

	const baseProps = {
		onClick: baseOnClick,
		items: [1, 2],
		config: { setting: 'A' },
	}
	const variantProps = {
		items: [3], // Overrides base
		'data-variant': 'test',
	}
	const compoundProps = {
		config: { setting: 'B', extra: true }, // Overrides base, adds extra
	}
	const directProps = {
		onClick: directOnClick, // Overrides base
		items: [4, 5], // Overrides variant
		config: { setting: 'C' }, // Overrides compound
		style: { transform: [{ scale: 1 }] }, // Example of complex style (RN)
		className: 'complex-class',
		ref: refObject,
	}

	const finalProps = mergeFinalProps(
		baseProps,
		variantProps,
		compoundProps,
		directProps,
	)

	// Check functions (should be the direct one)
	expect(finalProps.onClick).toBe(directOnClick)

	// Check arrays (should be the direct one)
	expect(finalProps.items).toEqual([4, 5])

	// Check objects (should be the direct one, no deep merge)
	// The mergeFinalProps function performs a shallow merge of non-style/className props
	expect(finalProps.config).toEqual({ setting: 'C' })

	// Check data attributes (comes from variant)
	expect(finalProps['data-variant']).toBe('test')

	// Check complex style
	expect(finalProps.style).toEqual({ transform: [{ scale: 1 }] })

	// Check className
	expect(finalProps.className).toBe('complex-class')

	// Check ref
	expect(finalProps.ref).toBe(refObject)
})
