import {PlayerInternals} from '@remotion/player';
import React, {
	FocusEventHandler,
	useCallback,
	useMemo,
	useRef,
	useState,
} from 'react';
import ReactDOM from 'react-dom';
import {BACKGROUND, getBackgroundFromHoverState} from '../../helpers/colors';
import {FONT_FAMILY} from '../../helpers/font';
import {
	MENU_BUTTON_CLASS_NAME,
	SUBMENU_CONTAINER_CLASS_NAME,
} from './is-menu-click';
import {MenuDivider} from './MenuDivider';
import {MenuSubItem} from './MenuSubItem';

const container: React.CSSProperties = {
	fontSize: 13,
	fontFamily: FONT_FAMILY,
	color: 'white',
	paddingLeft: 10,
	paddingRight: 10,
	cursor: 'default',
	paddingTop: 8,
	paddingBottom: 8,
	userSelect: 'none',
	border: 'none',
};

const menuContainer: React.CSSProperties = {
	backgroundColor: BACKGROUND,
	position: 'fixed',
	boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
	color: 'white',
	fontFamily: FONT_FAMILY,
	paddingTop: 4,
	paddingBottom: 4,
	userSelect: 'none',
	minWidth: 200,
};

const outerPortal: React.CSSProperties = {
	position: 'fixed',
	height: '100%',
	width: '100%',
	backgroundColor: 'rgba(255, 255, 255, 0.02)',
};

export type MenuId = 'remotion' | 'file' | 'help';

const portal = document.getElementById('menuportal') as Element;

export type Menu = {
	id: MenuId;
	label: string;
	items: TMenuItem[];
};

export type TMenuItem =
	| {
			type: 'divider';
			id: string;
	  }
	| {
			id: string;
			type: 'item';
			label: React.ReactNode;
			onClick: () => void;
	  };

export const MenuItem: React.FC<{
	label: string;
	id: MenuId;
	selected: boolean;
	onItemSelected: (id: MenuId) => void;
	onItemHovered: (id: MenuId) => void;
	onItemQuit: () => void;
	onItemFocused: (id: MenuId) => void;
	menu: Menu;
}> = ({
	label: itemName,
	selected,
	id,
	onItemSelected,
	onItemHovered,
	onItemQuit,
	onItemFocused,
	menu,
}) => {
	const [hovered, setHovered] = useState(false);
	const ref = useRef<HTMLButtonElement>(null);
	const size = PlayerInternals.useElementSize(ref, {
		triggerOnWindowResize: true,
	});

	const containerStyle = useMemo((): React.CSSProperties => {
		return {
			...container,
			backgroundColor: getBackgroundFromHoverState({
				hovered,
				selected,
			}),
			// Don't panic, we apply our own selected style
			outline: 'none',
		};
	}, [hovered, selected]);

	const portalStyle = useMemo((): React.CSSProperties | null => {
		if (!selected || !size) {
			return null;
		}

		return {
			...menuContainer,
			left: size.left,
			top: size.top + size.height,
		};
	}, [selected, size]);

	const onPointerEnter = useCallback(() => {
		onItemHovered(id);
		setHovered(true);
	}, [id, onItemHovered]);

	const onPointerLeave = useCallback(() => {
		setHovered(false);
	}, []);

	const onFocus: FocusEventHandler<HTMLButtonElement> = useCallback(() => {
		onItemFocused(id);
	}, [id, onItemFocused]);

	const onClick = useCallback(() => {
		if (selected) {
			onItemQuit();
		} else {
			onItemSelected(id);
		}
	}, [id, onItemQuit, onItemSelected, selected]);

	const outerStyle = useMemo(() => {
		return {
			...outerPortal,
			top: (size?.top ?? 0) + (size?.height ?? 0),
		};
	}, [size]);

	const menuContent = (
		<>
			{menu.items.map((item) => {
				if (item.type === 'divider') {
					return <MenuDivider key={item.id} />;
				}

				return (
					<MenuSubItem
						key={item.id}
						onActionSelected={item.onClick}
						label={item.label}
					/>
				);
			})}
		</>
	);

	return (
		<>
			<button
				ref={ref}
				role="button"
				onPointerEnter={onPointerEnter}
				onPointerLeave={onPointerLeave}
				onPointerDown={onClick}
				onFocus={onFocus}
				style={containerStyle}
				type="button"
				className={MENU_BUTTON_CLASS_NAME}
			>
				{itemName}
			</button>
			{portalStyle
				? ReactDOM.createPortal(
						<div style={outerStyle}>
							<div className={SUBMENU_CONTAINER_CLASS_NAME} style={portalStyle}>
								{menuContent}
							</div>
						</div>,
						portal
				  )
				: null}
		</>
	);
};
