import type { ElementType, ComponentProps, ComponentType, RefAttributes } from 'react'
export type { ComponentProps } from 'react'


/**
 * Define a estrutura esperada da configuração do componente.
 */
export type Config = {
	base?: object
	variants?: { [key: string]: { [key: string]: object } }
	defaultVariants?: { [key: string]: string | boolean }
	compoundVariants?: Array<object>
}

/**
 * Alias para ElementType representando um componente React válido.
 */
export type Component = ElementType


/**
 * Valida um objeto de propriedades `P` contra as propriedades válidas de um componente `T`,
 * permitindo também atributos `data-*` e rejeitando outras props inválidas.
 */
// 1. Tipo base que aceita props de T ou data-*
type AllowedProps<T extends Component> = ComponentProps<T> & { [key: `data-${string}`]: unknown };

// 2. Tipo que proíbe chaves extras
type ForbidExtraProps<T extends Component, P> = {
    [K in keyof P as K extends keyof AllowedProps<T> ? never : K]: never
};

// 3. Validação final: P deve ser um subtipo de AllowedProps E não pode ter chaves extras
export type OnlyValidProps<T extends Component, P> =
    P extends AllowedProps<T> // Garante que P é (pelo menos) um subconjunto de props permitidas
        ? P & ForbidExtraProps<T, P> // Intersecta com o tipo que proíbe extras
        : AllowedProps<T>; // Se P não for compatível, mostra o erro em relação ao tipo esperado


/**
 * Aplica recursivamente `OnlyValidProps` a cada objeto de estilo dentro da estrutura de variantes `V`.
 * Garante que todas as propriedades definidas dentro das variantes sejam válidas para o componente `T`.
 * 
 * @template T O tipo do componente base.
 * @template V O tipo da seção `variants` do objeto de configuração.
 */
export type ValidatedVariants<T extends Component, V> = V extends object
? {
    [VK in keyof V]: VK extends string
      ? {
          // Itera sobre as chaves das variantes (ex: 'test')
          [SK in keyof V[VK]]: SK extends string // Itera sobre as chaves de estilo (ex: 'a', 'b')
            ? OnlyValidProps<T, V[VK][SK]> // Valida as propriedades dentro de cada estilo
            : never
        }
      : never
  }
: V


/**
 * Define o tipo esperado para a seção `defaultVariants` e melhora o IntelliSense.
 * Para cada chave de variante `K` em `V`, o valor esperado é a união das chaves de estilo (`keyof V[K]`).
 * Se as chaves de estilo forem 'true' | 'false', o tipo esperado é `boolean`.
 * 
 * @template V O tipo da seção `variants` do objeto de configuração.
 */
export type ValidatedDefaultVariants<V> = V extends object
	? {
			[K in keyof V]?: keyof V[K] extends 'true' | 'false'
				? boolean
				: keyof V[K]
		}
	: {}


/**
 * Define a estrutura e os tipos esperados para as CONDIÇÕES de um item de `compoundVariants`.
 * Baseado nas chaves e valores definidos na seção `variants` (`V`).
 * Melhora o IntelliSense ao definir as condições.
 * 
 * @template V O tipo da seção `variants` do objeto de configuração.
 */
export type CompoundVariantConditions<V> = V extends object
	? {
			[K in keyof V]?: keyof V[K] extends 'true' | 'false'
				? boolean
				: keyof V[K]
		}
	: {}



/**
 * Valida um ÚNICO item dentro do array `compoundVariants`.
 * PRIORIZA IntelliSense para props sacrificando validação local nelas.
 */
export type ValidatedCompoundVariantItem<
	T extends Component,
	V,
	Item extends object 
> = 
    // 1. Aplica as condições esperadas
    CompoundVariantConditions<V> & 
    // 2. Define explicitamente o tipo de 'props' para IntelliSense
    //    Sacrifica a validação automática de OnlyValidProps AQUI.
    (Item extends { props: infer P } ? { props?: Partial<ComponentProps<T>> } : { props?: never }) & 
    // 3. Garante que não há chaves extras além das condições + 'props'
    { [K in keyof Item as K extends keyof V | 'props' ? never : K]?: never } & 
    // 4. Intersecta com o Item original para validar os valores das condições etc.
    Item;

// Valida o ARRAY compoundVariants inteiro (mantém ReadonlyArray)
type ValidatedCompoundVariants<T extends Component, V, CV> = CV extends ReadonlyArray<
    infer Item extends object
>
    ? ReadonlyArray<ValidatedCompoundVariantItem<T, V, Item>>
    : CV;

/**
 * Valida a estrutura completa do objeto de configuração `C` contra o componente `T`.
 * Aplica as validações específicas para `base`, `variants`, `defaultVariants` e `compoundVariants`.
 * Usa tipos condicionais para lidar com a ausência opcional de `defaultVariants` ou `compoundVariants`.
 * 
 * @template T O tipo do componente base.
 * @template C O tipo literal do objeto de configuração completo passado.
 */
export type ConfigSchema<T extends Component, C extends Config> = C extends {
	base?: infer B
	variants?: infer V
	defaultVariants?: infer DV
	compoundVariants?: infer CompV
}
	? {	
			// Caso 1: Todos existem
			base?: OnlyValidProps<T, B>
			variants?: ValidatedVariants<T, V>
			defaultVariants?: DV &
				ValidatedDefaultVariants<V> & {
					[KDV in keyof DV as KDV extends keyof V ? never : KDV]?: never
				}
			compoundVariants?: ValidatedCompoundVariants<T, V, CompV> // <<<--- VALIDA compoundVariants
		}
	: C extends { base?: infer B; variants?: infer V; defaultVariants?: infer DV }
		? {
				// Caso 2: Sem compoundVariants
				base?: OnlyValidProps<T, B>
				variants?: ValidatedVariants<T, V>
				defaultVariants?: DV &
					ValidatedDefaultVariants<V> & {
						[KDV in keyof DV as KDV extends keyof V ? never : KDV]?: never
					}
			}
		: C extends {
					base?: infer B
					variants?: infer V
					compoundVariants?: infer CompV
				}
			? {
					// Caso 3: Sem defaultVariants
					base?: OnlyValidProps<T, B>
					variants?: ValidatedVariants<T, V>
					compoundVariants?: ValidatedCompoundVariants<T, V, CompV>
				}
			: C extends { base?: infer B; variants?: infer V }
				? // Caso 4: Apenas base e variants
					{
						base?: OnlyValidProps<T, B>
						variants?: ValidatedVariants<T, V>
					}
				: { base?: unknown; variants?: unknown } // Tipo de fallback genérico


/**
 * Calcula o tipo das propriedades que representam as variantes ativas.
 * Baseado na seção `variants` do objeto de configuração `C`.
 * Se uma variante tiver chaves 'true'|'false', o tipo resultante é `boolean`.
 * 
 * @template C O tipo literal do objeto de configuração completo passado.
 */
export type CalculateVariantProps<C extends Config> = C extends { variants?: infer V } ? (V extends object ? {
    [K in keyof V]?: 
        keyof V[K] extends 'true' | 'false' 
        ? boolean
        : keyof V[K]
} : {}) : {};



/**
 * Calcula o tipo final das props para o componente estilizado retornado por `useStyled`.
 * Combina as props originais do componente base `T` (omitindo colisões com nomes de variantes)
 * com as propriedades calculadas das variantes (`CalculateVariantProps`) e adiciona `ref`.
 * 
 * @template T O tipo do componente base.
 * @template C O tipo literal do objeto de configuração completo passado.
 */
export type FinalProps<T extends Component, C extends Config> = 
    // Inclui RefAttributes<T> para permitir a prop ref
    RefAttributes<ComponentProps<T>['ref'] extends React.Ref<infer RefType> ? RefType : unknown> & 
    Omit<ComponentProps<T>, keyof CalculateVariantProps<C>> & 
    CalculateVariantProps<C>;


/**
 * Define o tipo genérico para o componente final retornado por `useStyled`.
 * É um `ComponentType` (de React) cujas props são definidas por `FinalProps`,
 * usando os tipos específicos `T` (componente base) e `C` (configuração) fornecidos.
 * 
 * @template T O tipo do componente base.
 * @template C O tipo literal do objeto de configuração completo passado.
 */
export type StyledComponent<T extends Component, C extends Config> = ComponentType<FinalProps<T, C>>