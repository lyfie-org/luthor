import { LexicalEditor, $getSelection } from "lexical";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { ExtensionCategory, BaseExtensionConfig } from "@lyfie/luthor-headless/extensions/types";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBaseEditor as useEditor } from "../../core/createEditorSystem";

/**
 * Context menu item definition
 */
export type ContextMenuItem = {
  label: string;
  action: () => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  separator?: boolean;
};

/**
 * Context menu provider registered by extensions
 */
export type ContextMenuProvider = {
  // Unique ID for this provider
  id: string;
  // Priority (higher = checked first)
  priority?: number;
  // Check if this provider should handle the context menu for the current selection/target
  canHandle: (context: {
    editor: LexicalEditor;
    target: HTMLElement;
    selection: any;
    event: MouseEvent;
  }) => boolean;
  // Get menu items when this provider is active
  getItems: (context: {
    editor: LexicalEditor;
    target: HTMLElement;
    selection: any;
    event: MouseEvent;
  }) => ContextMenuItem[];
  // Optional custom renderer for this provider's menu
  renderer?: ContextMenuRenderer;
};

/**
 * Context menu renderer function type
 */
export type ContextMenuRenderer = (props: {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
  className: string;
  style?: React.CSSProperties;
  itemClassName: string;
  itemStyle?: React.CSSProperties;
  disabledItemClassName: string;
  disabledItemStyle?: React.CSSProperties;
}) => React.ReactElement;

/**
 * Context menu configuration
 */
export interface ContextMenuConfig extends BaseExtensionConfig {
  // Default renderer for all context menus (can be overridden per provider)
  defaultRenderer?: ContextMenuRenderer;
  // Whether to prevent default browser context menu
  preventDefault?: boolean;
  // Theme classes
  theme?: {
    container?: string;
    item?: string;
    itemDisabled?: string;
  };
  // Custom CSS styles for UI elements
  styles?: {
    container?: React.CSSProperties;
    item?: React.CSSProperties;
    itemDisabled?: React.CSSProperties;
  };
}

/**
 * Commands exposed by the context menu extension
 */
export type ContextMenuCommands = {
  registerProvider: (provider: ContextMenuProvider) => void;
  unregisterProvider: (id: string) => void;
  showContextMenu: (config: {
    items: ContextMenuItem[];
    position: { x: number; y: number };
    renderer?: ContextMenuRenderer;
  }) => void;
  hideContextMenu: () => void;
};

/**
 * State queries for context menus
 */
export type ContextMenuStateQueries = {
  isContextMenuOpen: () => Promise<boolean>;
};

/**
 * Default context menu renderer - headless and theme-aware
 */
function DefaultContextMenuRenderer({
  items,
  position,
  onClose,
  className,
  style,
  itemClassName,
  itemStyle,
  disabledItemClassName,
  disabledItemStyle
}: {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
  className: string;
  style?: React.CSSProperties;
  itemClassName: string;
  itemStyle?: React.CSSProperties;
  disabledItemClassName: string;
  disabledItemStyle?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        item.separator ? (
          <div key={index} className="h-px bg-border my-1" />
        ) : (
          <div
            key={index}
            className={item.disabled ? disabledItemClassName : itemClassName}
            style={item.disabled ? disabledItemStyle : itemStyle}
            onClick={() => {
              if (!item.disabled && item.action) {
                item.action();
                onClose();
              }
            }}
          >
            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
            {item.label}
          </div>
        )
      ))}
    </div>
  );
}

/**
 * Context menu manager - handles provider registry and menu display
 */
class ContextMenuManager {
  private providers: Map<string, ContextMenuProvider> = new Map();
  private currentMenu: {
    items: ContextMenuItem[];
    position: { x: number; y: number };
    renderer?: ContextMenuRenderer;
    anchor?: {
      element: HTMLElement;
      offsetX: number;
      offsetY: number;
    };
  } | null = null;
  private listeners: Set<(menu: typeof this.currentMenu) => void> = new Set();
  private editor: LexicalEditor;
  private config: ContextMenuConfig;

  constructor(editor: LexicalEditor, config: ContextMenuConfig = {}) {
    this.editor = editor;
    this.config = config;
  }

  registerProvider(provider: ContextMenuProvider) {
    this.providers.set(provider.id, provider);
  }

  unregisterProvider(id: string) {
    this.providers.delete(id);
  }

  handleContextMenu(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Get current selection
    this.editor.getEditorState().read(() => {
      const selection = $getSelection();

      // Find the first provider that can handle this context
      const sortedProviders = Array.from(this.providers.values()).sort(
        (a, b) => (b.priority || 0) - (a.priority || 0)
      );

      for (const provider of sortedProviders) {
        const context = { editor: this.editor, target, selection, event };

        if (provider.canHandle(context)) {
          if (this.config.preventDefault !== false) {
            event.preventDefault();
          }

          const items = provider.getItems(context);
          
          if (items.length > 0) {
            const targetRect = target.getBoundingClientRect();
            this.showMenu({
              items,
              position: { x: event.clientX, y: event.clientY },
              renderer: provider.renderer || this.config.defaultRenderer,
              anchor: {
                element: target,
                offsetX: event.clientX - targetRect.left,
                offsetY: event.clientY - targetRect.top,
              },
            });
            return;
          }
        }
      }
    });
  }

  showMenu(config: {
    items: ContextMenuItem[];
    position: { x: number; y: number };
    renderer?: ContextMenuRenderer;
    anchor?: {
      element: HTMLElement;
      offsetX: number;
      offsetY: number;
    };
  }) {
    this.currentMenu = this.resolveAnchoredMenuConfig(config);
    this.notifyListeners();
  }

  hideMenu() {
    this.currentMenu = null;
    this.notifyListeners();
  }

  repositionMenuFromAnchor() {
    if (!this.currentMenu?.anchor) {
      return;
    }
    if (!this.currentMenu.anchor.element.isConnected) {
      this.hideMenu();
      return;
    }

    const next = this.resolveAnchoredMenuConfig(this.currentMenu);
    if (
      !this.currentMenu ||
      next.position.x !== this.currentMenu.position.x ||
      next.position.y !== this.currentMenu.position.y
    ) {
      this.currentMenu = next;
      this.notifyListeners();
    }
  }

  getCurrentMenu() {
    return this.currentMenu;
  }

  getPortalContainer(): HTMLElement | null {
    const root = this.editor.getRootElement();
    if (!root) {
      return null;
    }
    return (root.closest(".luthor-editor-wrapper") as HTMLElement | null) ?? null;
  }

  subscribe(listener: (menu: typeof this.currentMenu) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.currentMenu);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentMenu));
  }

  private resolveAnchoredMenuConfig(config: {
    items: ContextMenuItem[];
    position: { x: number; y: number };
    renderer?: ContextMenuRenderer;
    anchor?: {
      element: HTMLElement;
      offsetX: number;
      offsetY: number;
    };
  }) {
    if (!config.anchor) {
      return config;
    }

    const { element, offsetX, offsetY } = config.anchor;
    const rect = element.getBoundingClientRect();

    return {
      ...config,
      position: {
        x: rect.left + offsetX,
        y: rect.top + offsetY,
      },
    };
  }
}

/**
 * Context Menu Plugin - React component that renders the context menu
 */
function ContextMenuPlugin({ extension }: { extension: ContextMenuExtension }) {
  const { config } = useEditor();
  const [menuState, setMenuState] = useState<{
    items: ContextMenuItem[];
    position: { x: number; y: number };
    renderer?: ContextMenuRenderer;
  } | null>(null);

  // Get global theme
  const globalContextMenuTheme = config?.theme?.contextMenu || {};

  // Get extension-specific config
  const extensionConfig = extension.config;

  // Merged theme classes: extension config -> global theme (core theme provides defaults)
  const mergedThemeClasses = {
    container: extensionConfig?.theme?.container || globalContextMenuTheme.container || "luthor-context-menu",
    item: extensionConfig?.theme?.item || globalContextMenuTheme.item || "luthor-context-menu-item",
    itemDisabled: extensionConfig?.theme?.itemDisabled || globalContextMenuTheme.itemDisabled || "luthor-context-menu-item-disabled",
  };

  // Merged styles: extension config -> global theme
  const mergedStyles = {
    container: {
      ...extensionConfig?.styles?.container,
      ...globalContextMenuTheme.styles?.container,
    },
    item: {
      ...extensionConfig?.styles?.item,
      ...globalContextMenuTheme.styles?.item,
    },
    itemDisabled: {
      ...extensionConfig?.styles?.itemDisabled,
      ...globalContextMenuTheme.styles?.itemDisabled,
    },
  };

  useEffect(() => {
    // Subscribe to menu state changes from the extension
    const unsubscribe = extension.subscribe(setMenuState);
    return unsubscribe;
  }, [extension]);

  if (!menuState) {
    return null;
  }
  
  // Use the renderer from the menu state or fall back to the extension's default
  const Renderer = menuState.renderer || extension.config.defaultRenderer!;
  const portalContainer = extension.manager?.getPortalContainer() ?? null;
  const resolvedPosition = (() => {
    if (!portalContainer) {
      return menuState.position;
    }

    const rect = portalContainer.getBoundingClientRect();
    const rawX = menuState.position.x - rect.left;
    const rawY = menuState.position.y - rect.top;
    return {
      x: Math.max(8, Math.min(rawX, Math.max(8, rect.width - 8))),
      y: Math.max(8, Math.min(rawY, Math.max(8, rect.height - 8))),
    };
  })();
  const resolvedContainerStyle = portalContainer
    ? {
        position: "absolute" as const,
        ...mergedStyles.container,
      }
    : mergedStyles.container;

  return createPortal(
    <Renderer
      items={menuState.items}
      position={resolvedPosition}
      onClose={() => extension.manager?.hideMenu()}
      className={mergedThemeClasses.container}
      style={resolvedContainerStyle}
      itemClassName={mergedThemeClasses.item}
      itemStyle={mergedStyles.item}
      disabledItemClassName={mergedThemeClasses.itemDisabled}
      disabledItemStyle={mergedStyles.itemDisabled}
    />,
    portalContainer ?? document.body
  );
}

/**
 * Context menu extension - provides a clean, registry-based context menu system
 */
export class ContextMenuExtension extends BaseExtension<
  "contextMenu",
  ContextMenuConfig,
  ContextMenuCommands,
  ContextMenuStateQueries,
  React.ReactElement[]
> {
  public manager: ContextMenuManager | null = null;
  private pendingListeners: Set<(menu: any) => void> = new Set();

  constructor(config: ContextMenuConfig = {}) {
    super("contextMenu", [ExtensionCategory.Toolbar]);
    this.config = { 
      defaultRenderer: DefaultContextMenuRenderer, 
      position: "before", // Render before other plugins
      initPriority: 100, // High priority to register first
      ...config 
    };
  }

  configure(config: Partial<ContextMenuConfig>): this {
    this.config = { ...this.config, ...config };
    if (this.manager) {
      // Update manager config if needed
      Object.assign(this.manager, { config: this.config });
    }
    return this;
  }

  register(editor: LexicalEditor): () => void {
    this.manager = new ContextMenuManager(editor, this.config);

    // Notify any pending listeners that the manager is now available
    this.pendingListeners.forEach(listener => {
      this.manager?.subscribe(listener);
    });
    this.pendingListeners.clear();

    const handleContextMenu = (event: MouseEvent) => {
      this.manager?.handleContextMenu(event);
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.luthor-context-menu')) {
        this.manager?.hideMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.manager?.hideMenu();
      }
    };

    const handleViewportChange = () => {
      this.manager?.repositionMenuFromAnchor();
    };

    const editorElement = editor.getRootElement();
    
    if (editorElement) {
      editorElement.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("scroll", handleViewportChange, true);
      window.addEventListener("resize", handleViewportChange);

      return () => {
        editorElement.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
        window.removeEventListener("scroll", handleViewportChange, true);
        window.removeEventListener("resize", handleViewportChange);
        this.manager = null;
      };
    }

    return () => {
      this.manager = null;
    };
  }

  getCommands(editor: LexicalEditor): ContextMenuCommands {
    return {
      registerProvider: (provider: ContextMenuProvider) => {
        if (!this.manager) {
          this.manager = new ContextMenuManager(editor, this.config);
        }
        this.manager.registerProvider(provider);
      },
      unregisterProvider: (id: string) => {
        this.manager?.unregisterProvider(id);
      },
      showContextMenu: (config) => {
        this.manager?.showMenu(config);
      },
      hideContextMenu: () => {
        this.manager?.hideMenu();
      },
    };
  }

  getStateQueries(editor: LexicalEditor): ContextMenuStateQueries {
    void editor;
    return {
      isContextMenuOpen: () => Promise.resolve(this.manager?.getCurrentMenu() !== null),
    };
  }

  getPlugins(): React.ReactElement[] {
    return [<ContextMenuPlugin key="context-menu" extension={this} />];
  }

  // Public API for components to subscribe to menu changes
  subscribe(listener: (menu: any) => void): () => void {
    if (this.manager) {
      return this.manager.subscribe(listener);
    } else {
      // Manager not created yet, queue the listener
      this.pendingListeners.add(listener);
      return () => {
        this.pendingListeners.delete(listener);
      };
    }
  }
}

// Default instance
export const contextMenuExtension = new ContextMenuExtension();

