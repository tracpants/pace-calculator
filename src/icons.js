import { createIcons,
	EllipsisVertical,
	Award,
	Settings,
	CircleQuestionMark,
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
			EllipsisVertical,
			Award,
			Settings,
			CircleQuestionMark,
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
	EllipsisVertical,
	Award,
	Settings,
	CircleQuestionMark,
	X,
	Copy,
	Check,
	ChevronDown,
	Plus,
	Trash2,
	Edit
};
