// Importações de tipos locais (definidos em types.ts)
import type { Component, Config, ComponentProps } from './types';

// Importações para cn (adicione ao seu projeto)
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Tipos Auxiliares ---
type AnyObject = Record<string, any>;
// O tipo genérico para `style` será inferido como object ou CSSProperties/RN Styles pelo uso.
type StyleValue = object | undefined | null;
// Definindo StyleObject corretamente
type StyleObject = AnyObject;

// --- Funções Auxiliares Específicas ---

/**
 * Mescla múltiplos objetos de estilo (plain objects).
 * Objetos posteriores na lista sobrescrevem chaves anteriores.
 * Retorna um único objeto ou undefined se a mesclagem resultar em objeto vazio ou só houver entradas nulas.
 * NOTA: No React Native, se precisar de suporte para arrays/IDs,
 *       use StyleSheet.flatten ANTES de passar para esta função.
 */
export const mergeStyles = (...styles: Array<StyleValue>): StyleObject | undefined => {
	const validStyles = styles.filter(Boolean) as AnyObject[];

    if (validStyles.length === 0) return undefined;
    if (validStyles.length === 1) return validStyles[0];

    // Mescla os objetos de estilo válidos
    const merged = Object.assign({}, ...validStyles);
    // Retorna undefined se o objeto mesclado estiver vazio
    return Object.keys(merged).length > 0 ? merged : undefined;
};

/**
 * Mescla classes CSS usando clsx e tailwind-merge. Essencial para Tailwind/NativeWind.
 */
export function cn(...inputs: ClassValue[]): string | undefined {
    const result = twMerge(clsx(inputs));
	return result.length > 0 ? result : undefined;
}

/**
 * Verifica condições de compound variants.
 */
const checkCompoundVariantConditions = (
	conditions: Record<string, string | boolean>,
	activeVariants: Record<string, string | boolean | undefined>
): boolean => {
    for (const key in conditions) {
        if (conditions[key] !== activeVariants[key]) return false;
    }
    return true;
};

// --- Funções de Resolução de Props --- 

/**
 * Extrai e mescla as props definidas para as variantes ativas.
 * Versão otimizada mesclando style/className iterativamente.
 */
export const resolveVariantProps = <T extends Component, C extends Config>(
	configVariants: C['variants'],
	activeVariants: Record<string, string | boolean | undefined>
): Partial<ComponentProps<T>> => {
	const finalProps: Partial<ComponentProps<T>> = {};
    let currentMergedStyle: StyleValue | undefined = undefined; // Mudado para let
    let currentMergedClassName: ClassValue | undefined = undefined; // Mudado para let

	if (!configVariants) return {};

	for (const variantKey in activeVariants) {
		const variantValue = activeVariants[variantKey];
		if (variantValue !== undefined && configVariants[variantKey]) {
			const propsForVariant = configVariants[variantKey]?.[String(variantValue)];
			if (propsForVariant) {
                const { style, className, ...restProps } = propsForVariant as any;
                // Mescla outras props (última escrita vence)
                Object.assign(finalProps, restProps);
                // Mescla style iterativamente
                if (style) {
                    currentMergedStyle = mergeStyles(currentMergedStyle, style);
                }
                // Mescla className iterativamente
                if (className) {
                    currentMergedClassName = cn(currentMergedClassName, className);
                }
            }
		}
	}

    // Atribui os estilos e classes mesclados ao final
    if (currentMergedStyle) (finalProps as any).style = currentMergedStyle;
    if (currentMergedClassName) (finalProps as any).className = currentMergedClassName;

	return finalProps;
};

/**
 * Extrai e mescla as props definidas para as compound variants ativas.
 */
export const resolveCompoundVariantProps = <T extends Component, C extends Config>(
	compoundVariantsConfig: C['compoundVariants'],
	activeVariants: Record<string, string | boolean | undefined>
): Partial<ComponentProps<T>> => {
	const compoundProps: Partial<ComponentProps<T>> = {};
	if (!compoundVariantsConfig) return compoundProps;
	for (const compoundItem of compoundVariantsConfig) {
        const { props: itemProps, ...conditions } = compoundItem as AnyObject;
        if (checkCompoundVariantConditions(conditions, activeVariants)) {
            if(itemProps) Object.assign(compoundProps, itemProps);
        }
    }
	return compoundProps;
};

/**
 * Função principal para mesclar todas as fontes de props na ordem de prioridade correta.
 * Versão otimizada para reduzir criação de objetos intermediários.
 */
export const mergeFinalProps = <T extends Component>(
    base: Partial<ComponentProps<T>> | undefined,
    variants: Partial<ComponentProps<T>>,
    compounds: Partial<ComponentProps<T>>,
    direct: Partial<ComponentProps<T>> // Inclui ref aqui
): ComponentProps<T> => {
    const { ref, ...otherDirectProps } = direct || {};

    const sources = [base, variants, compounds, otherDirectProps];
    const finalProps: AnyObject = {};
    const stylesToMerge: StyleValue[] = [];
    const classesToMerge: ClassValue[] = [];

    // Itera pelas fontes para coletar styles, classes e outras props
    for (const source of sources) {
        if (!source) continue;

        for (const key in source) {
            if (key === 'style') {
                stylesToMerge.push(source.style);
            } else if (key === 'className') {
                classesToMerge.push(source.className);
            } else if (key !== 'ref') { // Ignora ref aqui, tratado separadamente
                // Props posteriores sobrescrevem anteriores
                finalProps[key] = source[key as keyof typeof source];
            }
        }
    }

    // Mescla styles e classNames coletados
    const mergedStyle = mergeStyles(...stylesToMerge);
    const mergedClassName = cn(...classesToMerge);

    // Adiciona styles, classes e ref ao objeto final
    if (mergedStyle) finalProps.style = mergedStyle;
    if (mergedClassName) finalProps.className = mergedClassName;
    if (ref) finalProps.ref = ref; // Adiciona ref de volta

    return finalProps as ComponentProps<T>;
};