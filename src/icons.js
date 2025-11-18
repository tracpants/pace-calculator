import { createIcons,
	MoreVertical,
	Award,
	Settings,
	HelpCircle,
	X,
	Copy,
	Check,
	ChevronDown,
	Plus,
	Trash2,
	Edit
} from 'lucide';

export function initIcons() {
	// Initialize Lucide icons - replaces all <i data-lucide="icon-name"></i> elements
	createIcons({
		icons: {
			MoreVertical,
			Award,
			Settings,
			HelpCircle,
			X,
			Copy,
			Check,
			ChevronDown,
			Plus,
			Trash2,
			Edit
		}
	});
}

// Export for programmatic icon creation
export {
	MoreVertical,
	Award,
	Settings,
	HelpCircle,
	X,
	Copy,
	Check,
	ChevronDown,
	Plus,
	Trash2,
	Edit
};
