var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};

// index.tsx
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { jsx } from "react/jsx-runtime";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function mergeProps(...propsList) {
  const result = {};
  for (const props of propsList) {
    if (!props) continue;
    for (const key in props) {
      if (!Object.prototype.hasOwnProperty.call(props, key)) continue;
      const value = props[key];
      if (key === "className" && typeof value === "string" && value) {
        result.className = cn(result.className, value);
      } else if (key === "style" && typeof value === "object" && value !== null && typeof result.style === "object" && result.style !== null) {
        result.style = __spreadValues(__spreadValues({}, result.style), value);
      } else if (value !== void 0) {
        result[key] = value;
      }
    }
  }
  return result;
}
function isBooleanVariant(variant) {
  if (!variant || typeof variant !== "object") return false;
  const keys = Object.keys(variant);
  return keys.length === 1 && keys[0] === "true";
}
function useStyled(component, config) {
  const Tag = component;
  const {
    base = {},
    // Base styles object
    name = "UnnamedStyledComponent",
    // Provide a default name
    variants,
    compoundVariants,
    defaultVariants,
    debug = false
    // Default debug to false
  } = config || {};
  const variantKeys = variants ? Object.keys(variants) : [];
  const logEvent = (event, details) => {
    if (debug) {
      const entry = __spreadValues({
        component: name,
        event
      }, details && { details });
      console.log(JSON.stringify(entry, null, 2));
    }
  };
  const applyCompoundVariants = (currentProps) => {
    let compoundVariantProps = {};
    if (!compoundVariants || compoundVariants.length === 0) {
      logEvent("compound_variants_skip_empty");
      return {};
    }
    logEvent("compound_variants_start", {
      count: compoundVariants.length,
      currentPropsKeys: Object.keys(currentProps)
    });
    for (const compound of compoundVariants) {
      const _a = compound, { className, style } = _a, conditions = __objRest(_a, ["className", "style"]);
      let isMatch = true;
      logEvent("compound_variants_check_condition", {
        conditionsKeys: Object.keys(conditions)
      });
      for (const key in conditions) {
        const conditionValue = conditions[key];
        const propValue = currentProps[key];
        logEvent("compound_variants_check_condition_value", {
          key,
          conditionValue,
          propValue
        });
        if (propValue !== conditionValue) {
          isMatch = false;
          logEvent("compound_variants_condition_mismatch", {
            key,
            conditionValue,
            propValue
          });
          break;
        }
        logEvent("compound_variants_condition_match", {
          key,
          conditionValue,
          propValue
        });
      }
      if (isMatch) {
        logEvent("compound_variants_match_found", {
          conditionsKeys: Object.keys(conditions),
          appliedStylesKeys: Object.keys(compound)
        });
        const compoundSpecificProps = {};
        for (const key in compound) {
          if (!(key in conditions)) {
            compoundSpecificProps[key] = compound[key];
          }
        }
        logEvent("compound_variants_apply_props", {
          compoundSpecificPropsKeys: Object.keys(compoundSpecificProps)
        });
        compoundVariantProps = mergeProps(
          compoundVariantProps,
          // Assert type here as we constructed it manually
          compoundSpecificProps
        );
      } else {
        logEvent("compound_variants_match_not_found", {
          conditionsKeys: Object.keys(conditions)
        });
      }
    }
    logEvent("compound_variants_complete", {
      finalCompoundPropsKeys: Object.keys(compoundVariantProps)
    });
    return compoundVariantProps;
  };
  const applyBaseVariants = (currentProps) => {
    let variantProps = {};
    if (!variants) {
      logEvent("base_variants_skip_empty");
      return {};
    }
    logEvent("base_variants_start", {
      count: variantKeys.length,
      variantsKeys: Object.keys(variants || {}),
      currentPropsKeys: Object.keys(currentProps),
      defaultVariantsKeys: Object.keys(defaultVariants || {})
    });
    for (const key of variantKeys) {
      const variantDef = variants[key];
      if (!variantDef) continue;
      const isBoolean = isBooleanVariant(variantDef);
      logEvent("base_variants_check_boolean", { key, isBoolean });
      let propValue = currentProps[key];
      const defaultValue = defaultVariants && key in defaultVariants ? defaultVariants[key] : void 0;
      if (isBoolean) {
        if (propValue === true) {
          propValue = "true";
          logEvent("base_variants_boolean_conversion", {
            key,
            originalValue: currentProps[key],
            convertedValue: "true"
          });
        } else if (propValue === false || propValue === void 0) {
          logEvent("base_variants_boolean_skip", {
            key,
            value: propValue
          });
          continue;
        } else if (propValue === "true" || propValue === "false") {
          logEvent("base_variants_boolean_invalid", {
            key,
            value: propValue
          });
          logEvent("base_variants_boolean_invalid_hint", {
            key,
            hint: "Use boolean value instead of string"
          });
          continue;
        }
      }
      if (propValue !== void 0) {
        propValue = String(propValue);
      }
      const variantStyles = variantDef[propValue];
      if (propValue !== void 0 && variantStyles) {
        logEvent("base_variants_applied", {
          key,
          value: propValue,
          stylesKeys: Object.keys(variantStyles)
        });
        variantProps = mergeProps(variantProps, variantStyles);
      } else {
        logEvent("base_variants_not_found", {
          key,
          lookupValue: propValue
        });
      }
    }
    logEvent("base_variants_complete", {
      finalBasePropsKeys: Object.keys(variantProps)
    });
    return variantProps;
  };
  const separateProps = (allProps) => {
    const variantProps = {};
    const directProps = {};
    logEvent("props_separation_start", {
      // Log only keys to avoid circular references in potential complex props
      inputPropKeys: Object.keys(allProps),
      variantKeys
    });
    for (const key in allProps) {
      if (Object.prototype.hasOwnProperty.call(allProps, key)) {
        const value = allProps[key];
        if (variantKeys.includes(key)) {
          variantProps[key] = value;
          logEvent("props_separation_variant", {
            key,
            value
          });
        } else {
          directProps[key] = value;
          logEvent("props_separation_direct", {
            key,
            value
          });
        }
      }
    }
    logEvent("props_separation_complete", {
      separatedVariantPropsKeys: Object.keys(variantProps),
      separatedDirectPropsKeys: Object.keys(directProps)
    });
    return {
      variantProps,
      directProps
    };
  };
  function StyledComponent(props) {
    logEvent("render_start", { receivedPropKeys: Object.keys(props) });
    const _a = props, { children } = _a, restProps = __objRest(_a, ["children"]);
    const { variantProps, directProps } = separateProps(restProps);
    const activeVariantProps = __spreadValues(__spreadValues({}, defaultVariants), variantProps);
    logEvent("active_variants_determined", {
      inputVariantPropsKeys: Object.keys(variantProps),
      defaultVariantsKeys: Object.keys(defaultVariants || {}),
      finalActiveVariantPropsKeys: Object.keys(activeVariantProps)
    });
    logEvent("prop_merging_start", {
      baseKeys: Object.keys(base || {}),
      directPropsKeys: Object.keys(directProps),
      activeVariantPropsKeys: Object.keys(activeVariantProps)
    });
    logEvent("prop_merging_apply_compound");
    const compoundVariantStyles = applyCompoundVariants(activeVariantProps);
    logEvent("prop_merging_apply_base");
    const baseVariantStyles = applyBaseVariants(activeVariantProps);
    logEvent("prop_merging_final_merge");
    const mergedProps = mergeProps(
      base,
      // 1. Base
      compoundVariantStyles,
      // 2. Compound Variants
      baseVariantStyles,
      // 3. Base Variants
      // Cast directProps to Partial as required by mergeProps
      directProps
      // 4. Instance overrides
    );
    const _b = mergedProps, { className, style } = _b, finalRestProps = __objRest(_b, ["className", "style"]);
    logEvent("prop_merging_complete", {
      // Log final pieces separately to avoid complex object stringification issues
      finalClassName: className,
      finalStyleKeys: Object.keys(style || {}),
      finalRestPropKeys: Object.keys(finalRestProps)
    });
    logEvent("render_component", {
      // Avoid logging Tag component and full props object to prevent cycles
      componentDisplayName: typeof Tag === "string" ? Tag : name,
      // Use name for non-string tags
      renderedClassName: className,
      renderedStyleKeys: Object.keys(style || {}),
      renderedRestPropKeys: Object.keys(finalRestProps)
    });
    return (
      // Using 'as any' here as a pragmatic solution for complex generic type issues
      // in JSX spread attributes. Although not ideal for type safety, it resolves the
      // persistent compilation error related to LibraryManagedAttributes.
      /* @__PURE__ */ jsx(Tag, __spreadProps(__spreadValues({ className, style }, finalRestProps), { children }))
    );
  }
  const componentDisplayName = typeof Tag === "string" ? Tag : Tag.displayName || Tag.name || "Component";
  StyledComponent.displayName = `Styled(${componentDisplayName})`;
  logEvent("hook_complete", { componentDisplayName });
  return StyledComponent;
}
export {
  useStyled
};
//# sourceMappingURL=index.mjs.map