# use-styled 🎨

Uma biblioteca React/React Native poderosa e flexível, inspirada em Stitches, CVA e Tamagui, para criar componentes estilizados com variantes de forma declarativa e com forte segurança de tipos usando TypeScript.

`use-styled` permite que você desacople a lógica de estilo e variantes da lógica do seu componente, tornando seu código mais limpo, reutilizável e fácil de manter.

## Funcionalidades

*   **API Simples:** Um único hook `useStyled` para criar seus componentes estilizados.
*   **Configuração Declarativa:** Defina estilos base, variantes, variantes padrão e variantes compostas em um objeto de configuração claro.
*   **Type-Safe:** Totalmente escrito em TypeScript, com validação de configuração em tempo de compilação para evitar erros.
*   **Agnóstico de Plataforma (Estilos):** Funciona com React para Web (via `style` ou `className`) e React Native (via `style`).
*   **Suporte a Tailwind/CSS:** Use a prop `className` nas configurações para aplicar classes CSS, ideal para integração com Tailwind CSS, CSS Modules, etc.
*   **Variantes Múltiplas:** Aplique múltiplas variantes simultaneamente (tamanho, cor, estado, etc.).
*   **Variantes Compostas:** Aplique estilos específicos para combinações de variantes.
*   **Variantes Padrão:** Defina valores padrão para suas variantes.
*   **Mesclagem Inteligente:** Mescla automaticamente `style` (objetos de estilo) e `className` (para web, usando `clsx` e `tailwind-merge` implicitamente) de diferentes fontes (base, variantes, compostas, props diretas).
*   **Repasse Automático de Props:** Props passadas ao componente estilizado que não são nomes de variantes são automaticamente repassadas ao componente base.

## Uso Básico

A API principal é o hook `useStyled`.

```tsx
import { useStyled } from 'use-styled'; // Ajuste o caminho da importação
import { View } from 'react-native'; // ou 'div', 'button', etc.

const ComponenteEstilizado = useStyled(ComponenteBase, {
  base: {
    // ... props base
  },
  variants: {
    // ... definições de variantes
  },
  defaultVariants: {
    // ... valores padrão para variantes
  },
  compoundVariants: [
    // ... regras para combinações de variantes
  ]
});

// Uso:
<ComponenteEstilizado propVariante1="valor" propVariante2={true} propDoComponenteBase="abc" />
```

*   **`ComponenteBase`**: O componente React que você deseja estilizar (ex: `View`, `Text`, `'div'`, `'button'`, ou um componente customizado).
*   **`configuracao`**: Um objeto que define como o componente será estilizado.

## Objeto de Configuração Detalhado

O objeto de configuração é o coração do `useStyled`.

### `base` (Opcional)

Um objeto contendo props que serão aplicadas incondicionalmente ao `ComponenteBase`.

*   Use `style` para aplicar objetos de estilo inline ou React Native.
*   Use `className` para aplicar classes CSS (ex: Tailwind) na web.
*   Outras props válidas para o `ComponenteBase` (incluindo `data-*`) também são permitidas.

```js
{
  base: {
    style: { boxSizing: 'border-box', margin: 0 }, // Estilo base
    className: 'font-sans antialiased', // Classes base (ex: Tailwind)
    'data-component': 'base-element'
  }
}
```

### `variants` (Opcional)

Define os diferentes estados visuais ou comportamentais.

*   Chave externa: nome da variante (prop).
*   Chave interna: valor da variante (`string` ou `boolean`).
*   Valor final: objeto de props a serem aplicadas (`style`, `className`, ou outras props válidas).

```js
{
  variants: {
    intent: {
      primary: {
        style: { /* RN Style */ },
        className: 'bg-blue-500 text-white hover:bg-blue-600' // Estilo Web/Tailwind
      },
      secondary: {
        style: { /* RN Style */ },
        className: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      }
    },
    size: {
      small: { style: { padding: '8px 12px', fontSize: 14 } }, // Estilo objeto
      medium: { style: { padding: '12px 16px', fontSize: 16 } }
    },
    disabled: {
      true: { 
        style: { opacity: 0.5 }, 
        className: 'opacity-50 cursor-not-allowed' 
      },
    }
  }
}
```

### `defaultVariants` (Opcional)

Especifica quais valores de variante usar quando nenhuma prop correspondente for passada ao componente estilizado.

```js
{
  variants: { /* ... como acima ... */ },
  defaultVariants: {
    intent: 'primary', // Se <Button /> for usado, intent será 'primary'
    size: 'medium',   // Se <Button /> for usado, size será 'medium'
    disabled: false   // Se <Button disabled /> ou <Button disabled={undefined} /> for usado, será false
  }
}
```

### `compoundVariants` (Opcional)

Permite aplicar props adicionais quando uma **combinação específica** de variantes está ativa. É um array de objetos, onde cada objeto define as condições e as props a serem aplicadas.

As `props` definidas aqui são mescladas sobre as props de `base` e das `variants` ativas (seguindo a ordem de precedência: base -> variants -> compound -> props diretas).

```js
{
  variants: { /* ... como acima ... */ },
  compoundVariants: [
    // Quando intent='primary' E disabled=true
    {
      intent: 'primary',
      disabled: true,
      props: {
        style: { backgroundColor: 'darkblue' } // Sobrescreve o backgroundColor da variante 'primary'
      }
    },
    // Quando intent='secondary' E size='small'
    {
      intent: 'secondary',
      size: 'small',
      props: {
        style: { borderWidth: 2, borderColor: 'black' } // Adiciona borda
      }
    }
  ]
}
```

## Repasse de Props (Props Diretas)

Qualquer prop que você passar para o componente estilizado e que **não** seja um nome de variante definido na configuração será automaticamente repassada para o `ComponenteBase` subjacente.

Isso permite que você use todas as props nativas do componente base, como manipuladores de evento (`onClick`, `onPress`), atributos `aria-*`, `id`, etc., diretamente no seu componente estilizado.

```tsx
const MeuBotaoEstilizado = useStyled('button', {
  variants: {
    intent: { /* ... */ }
  }
});

// Uso:
<MeuBotaoEstilizado 
  intent="primary"  // <-- Prop de variante
  onClick={() => alert('Clicou!')} // <-- Repassada para o <button>
  id="meu-id"         // <-- Repassada para o <button>
  aria-label="Confirmar" // <-- Repassada para o <button>
>
  Clique Aqui
</MeuBotaoEstilizado>
```

As props `style` e `className` passadas diretamente também são tratadas de forma especial: elas são inteligentemente mescladas com os estilos e classes definidos na configuração, com as props diretas tendo a maior prioridade em caso de conflitos.

## Exemplos Práticos

### Exemplo 1: Componente `Button` Flexível

Vamos criar um botão que pode ter diferentes intenções, tamanhos e estados de carregamento.

```tsx
import React from 'react';
import { useStyled } from 'use-styled';
import { ActivityIndicator, Pressable, Text } from 'react-native'; // Exemplo RN

// Ou para web:
// const SimpleButton = (props) => <button data-testid="simple-button" {...props} />;

const ButtonBase = React.forwardRef((props, ref) => (
  // Use Pressable no RN para melhor feedback tátil
  <Pressable ref={ref} {...props} />
));

const Button = useStyled(ButtonBase, {
  base: {
    style: {
      borderWidth: 0,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row', // Para alinhar texto e indicador
    },
    // Props padrão do Pressable/Button podem ir aqui
    accessibilityRole: 'button',
  },
  variants: {
    intent: {
      primary: {
        style: { backgroundColor: '#007AFF' }, // Azul
        // Vamos definir a cor do texto separadamente para clareza
      },
      secondary: {
        style: { backgroundColor: '#E5E5EA' }, // Cinza claro
      },
      danger: {
        style: { backgroundColor: '#FF3B30' }, // Vermelho
      },
    },
    size: {
      medium: {
        style: { paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 },
      },
      small: {
        style: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 },
      },
    },
    outline: {
      true: {
        style: { borderWidth: 1 },
      },
    },
    loading: {
      true: {
        style: { opacity: 0.7 },
        // Poderíamos desabilitar interações aqui também
      },
    },
    // Variante separada para cor do texto/ícone
    contentColor: {
       white: { style: { color: '#FFFFFF' } },
       black: { style: { color: '#1C1C1E' } },
       blue: { style: { color: '#007AFF' } },
       red: { style: { color: '#FF3B30' } },
    }
  },
  defaultVariants: {
    intent: 'primary',
    size: 'medium',
    outline: false,
    loading: false,
    contentColor: 'white', // Default para primário
  },
  compoundVariants: [
    // Ajusta cor do conteúdo e borda para secundário
    {
      intent: 'secondary',
      props: { contentColor: 'blue' }
    },
    {
      intent: 'secondary',
      outline: true,
      props: { style: { borderColor: '#007AFF' }} // Borda azul para outline secondary
    },
    // Ajusta cor do conteúdo e borda para danger
    {
      intent: 'danger',
      props: { contentColor: 'white' } // Texto branco no botão vermelho
    },
    {
        intent: 'danger',
        outline: true,
        props: {
            style: { backgroundColor: 'transparent', borderColor: '#FF3B30' }, // Fundo transparente
            contentColor: 'red' // Texto vermelho
        }
    },
    // Ajusta cor do conteúdo para primário outline
     {
      intent: 'primary',
      outline: true,
      props: {
          style: { backgroundColor: 'transparent', borderColor: '#007AFF' },
          contentColor: 'blue'
       }
    },
  ],
});

// Componente de Texto interno para aplicar a cor
const ButtonText = useStyled(Text, {
    variants: {
        contentColor: {
           white: { style: { color: '#FFFFFF' } },
           black: { style: { color: '#1C1C1E' } },
           blue: { style: { color: '#007AFF' } },
           red: { style: { color: '#FF3B30' } },
        },
        size: {
            medium: { style: { fontSize: 16, fontWeight: '600' } },
            small: { style: { fontSize: 14, fontWeight: '500' } },
        }
    },
     defaultVariants: {
        size: 'medium',
        // contentColor será passado do Button
    }
});


// Uso do Botão
const App = () => (
  <View style={{ padding: 20, gap: 10 }}>
    <Button>
      <ButtonText>Primário Médio</ButtonText>
    </Button>
    <Button intent="secondary" size="small">
       <ButtonText contentColor="blue" size="small">Secundário Pequeno</ButtonText>
    </Button>
     <Button intent="danger" outline={true}>
       <ButtonText contentColor="red">Danger Outline</ButtonText>
    </Button>
    <Button intent="primary" outline={true} size="small">
       <ButtonText contentColor="blue" size="small">Primary Outline Small</ButtonText>
    </Button>
    <Button loading={true} intent="primary">
      {/* Passamos explicitamente contentColor aqui por causa do ActivityIndicator */}
      <ButtonText contentColor="white">Carregando...</ButtonText>
      {/* RN: size e color no ActivityIndicator não vêm do useStyled */}
      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 8 }} />
    </Button>
  </View>
);

```

### Exemplo 2: Componente `Badge` (Web)

```tsx
import React from 'react';
import { useStyled } from 'use-styled';

const Badge = useStyled('span', {
  base: {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '9999px', // pill shape
      fontWeight: 500,
      whiteSpace: 'nowrap',
    },
    className: 'badge',
  },
  variants: {
    colorScheme: {
      neutral: {
        style: { backgroundColor: '#E5E7EB', color: '#374151' },
        className: 'badge-neutral',
      },
      info: {
        style: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
        className: 'badge-info',
      },
      success: {
        style: { backgroundColor: '#D1FAE5', color: '#065F46' },
        className: 'badge-success',
      },
      warning: {
        style: { backgroundColor: '#FEF3C7', color: '#92400E' },
        className: 'badge-warning',
      },
      danger: {
        style: { backgroundColor: '#FEE2E2', color: '#991B1B' },
        className: 'badge-danger',
      },
    },
    size: {
      sm: { style: { fontSize: 12, padding: '2px 8px' } },
      md: { style: { fontSize: 14, padding: '3px 10px' } },
    },
    // Adiciona uma variante para ter um ponto (dot)
    withDot: {
      true: {
        style: { paddingLeft: '6px' }, // Ajusta padding esquerdo para o ponto
      },
    },
  },
  defaultVariants: {
    colorScheme: 'neutral',
    size: 'sm',
    withDot: false,
  },
});

// Componente auxiliar para o ponto
const Dot = useStyled('span', {
    base: { style: { display: 'inline-block', width: 6, height: 6, marginRight: 5, borderRadius: '50%' } },
    variants: {
         colorScheme: {
            neutral: { style: { backgroundColor: '#6B7280' } },
            info: { style: { backgroundColor: '#3B82F6' } },
            success: { style: { backgroundColor: '#10B981' } },
            warning: { style: { backgroundColor: '#F59E0B' } },
            danger: { style: { backgroundColor: '#EF4444' } },
        }
    },
     defaultVariants: {
        colorScheme: 'neutral',
    }
});

// Uso
const App = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
    <Badge>Padrão</Badge>
    <Badge colorScheme="success" size="md">
      Sucesso MD
    </Badge>
    <Badge colorScheme="danger" withDot={true}>
      <Dot colorScheme="danger" />
      Perigo com Ponto
    </Badge>
     <Badge colorScheme="info" size="md" withDot={true}>
      <Dot colorScheme="info" />
      Info MD com Ponto
    </Badge>
    <Badge colorScheme="warning">Aviso</Badge>
  </div>
);
```

## TypeScript

A biblioteca oferece forte integração com TypeScript. A configuração é validada em tempo de compilação usando o tipo `ConfigSchema`, garantindo que:

*   As propriedades definidas em `base`, `variants` e `compoundVariants.props` sejam válidas para o `ComponenteBase`.
*   Os valores em `defaultVariants` correspondam a variantes e valores definidos.
*   As condições em `compoundVariants` usem nomes e valores de variantes válidos.

Atributos `data-*` são permitidos na configuração. Outras propriedades inválidas gerarão erros de tipo.

O tipo das props do componente final é inferido automaticamente, combinando as props originais do `ComponenteBase` (exceto aquelas usadas como nomes de variantes) com as props das variantes definidas.

## Notas

*   **Performance:** A biblioteca adiciona uma pequena sobrecarga em tempo de execução para calcular os estilos. Para a maioria das aplicações, isso é insignificante, mas benchmarks estão disponíveis (veja seção de testes). A memoização interna ajuda a otimizar re-renderizações.
*   **React Native:** Ao usar com React Native, lembre-se que a prop `className` não tem efeito. Use apenas a prop `style` com objetos de estilo válidos para RN.
*   **Compatibilidade (NativeWind):** No momento, a integração direta com **NativeWind v4** no React Native (passando classes NativeWind via prop `className`) **não é suportada**. O suporte está planejado para futuras versões. Para estilização no React Native, utilize a prop `style`.

---

*Desenvolvido com ❤️*
