# Changelog

## [Unreleased]

## [1.1.0] - 2025-05-27

🚀 **Function Composition - Enhanced Developer Experience**

This release introduces automatic function composition, making it easier to combine variant behaviors with direct props.

### 🎯 New Feature: Function Composition
Functions in variants now automatically **compose** with direct props instead of being overwritten.

**Before v1.1.0:**
```tsx
// Only the direct onClick would execute
<Button variant="haptic" onClick={() => track()} />
```

**Now in v1.1.0:**
```tsx
// Both haptic AND track functions execute automatically!
<Button variant="haptic" onClick={() => track()} />
```

### 🔄 What Changed
- **Function props** (`onClick`, `onPress`, `onFocus`, etc.) now compose instead of override
- **Execution order**: variant → direct prop (consistent and predictable)
- **Non-function props** maintain the same override behavior
- **Zero breaking changes** for existing code using non-function props

### 🧪 Technical Details
- Added `composeFunctions` utility for automatic function composition
- Enhanced error handling with detailed logging
- Comprehensive test coverage (33 tests, 121 assertions)
- Zero performance impact for non-function props

### 📖 Migration
This change has minimal impact and improves the developer experience. Only affects edge cases where function override was intentionally used.

**Upgrade**: `bun add use-styled@latest`

---

## [1.0.0] - 2025-05-05

🎉 **Initial Release of use-styled**

A powerful library for creating React and React Native components with variants in an elegant and integrated way.

### ✨ Features
- `useStyled`: Create styled components with variants
- `useSlot`: Attach slot components for composition  
- **Type Safety**: Full TypeScript inference and validation
- **Performance**: Optimized prop merging and style composition
- **Cross-platform**: Same API for React (Web) and React Native
- **Tailwind/NativeWind Ready**: Use `className` directly in variants
- **DX**: Excellent developer experience with autocompletion

### 🚀 Key Capabilities
- Base styles and props always applied
- Variant system for different visual states
- Compound variants for complex combinations
- Default variants configuration
- Automatic prop forwarding and ref support

**Get started**: `bun add use-styled`

**Documentation**: https://usestyled.com/