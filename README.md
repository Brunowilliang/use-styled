# use-styled ⚡️

![use-styled logo](./assets/logo.png)

Crie componentes React e React Native com variantes de forma elegante e integrada.

`use-styled` permite desacoplar a lógica de estilização e variantes da lógica do componente, tornando seu código mais limpo, reutilizável e fácil de manter, com uma API focada na experiência do desenvolvedor (DX).

**➡️ [Visite a Documentação Completa](https://use-styled-docs.vercel.app/) para guias, exemplos e referências.**

## Instalação

```bash
npm install use-styled
# ou
yarn add use-styled
# ou
pnpm add use-styled
# ou
bun add use-styled
```

## Uso Básico

O coração da biblioteca é o hook `useStyled`:

```tsx
import { useStyled } from 'use-styled';
import { Pressable, Text } from 'react-native'; // Ou 'button', 'div', etc.

const Button = useStyled(Pressable, {
  base: {
    // Estilos/props base aplicados sempre
    className: 'px-4 py-2 rounded-md',
  },
  variants: {
    intent: {
      primary: { className: 'bg-blue-500' },
      secondary: { className: 'bg-gray-200' },
    },
    size: {
      sm: { className: 'text-sm' },
      md: { className: 'text-base' },
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'md',
  }
});

const ButtonText = useStyled(Text, {
  // ... configuração para o texto ...
});

// Exemplo de uso
function MyComponent() {
  return (
    <Button intent="secondary" size="sm">
      <ButtonText>Click Me</ButtonText>
    </Button>
  );
}
```

## Principais Características

*   **API Integrada**: Defina estilos, variantes e o componente em um único hook.
*   **Type-Safe por Design**: Inferência de tipos e validação para segurança e autocompletar.
*   **Cross-Platform**: Mesma API para React (Web) e React Native.
*   **Tailwind/NativeWind Ready**: Use `className` diretamente nas variantes.

**Explore a [Documentação Completa](https://use-styled-docs.vercel.app/) para aprender sobre `compoundVariants`, `style` vs `className`, uso avançado e mais!**

---

*Desenvolvido com ❤️ por Bruno Garcia*
