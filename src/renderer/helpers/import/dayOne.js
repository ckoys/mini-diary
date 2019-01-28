import moment from 'moment';

import { toIndexDate } from '../dateFormat';
import { t } from '../../electron/ipcRenderer/senders';

/**
 * Remove empty lines and meta info from start of entry array
 */
function removeEmptyLinesFromStart(lines) {
	while (lines.length > 0 && (lines[0] === '' || lines[0].startsWith('\t'))) {
		lines.shift();
	}
	return lines;
}

/**
 * Parse the TXT file generated by a Day One export and format it as a processable object
 */
export function parseDayOneTxt(dayOneTxt) {
	const now = new Date().toString();

	// Split up diary entries
	const entryList = dayOneTxt.split('\tDate:\t');

	// Parse date, title, and text from diary entries
	const importObj = {};
	entryList.forEach(entry => {
		if (entry) {
			// Split up lines
			let lines = entry.split('\n');

			// Parse date (format "01 January 1980 at 00:00:00 CET")
			const dateStr = lines.shift();
			const dateMoment = moment(dateStr, 'DD MMMM YYYY');
			if (!dateMoment.isValid()) {
				throw Error(`${t('invalid-date')}: "${dateStr}"`);
			}
			const indexDate = toIndexDate(dateMoment);

			// Use first line as title
			lines = removeEmptyLinesFromStart(lines);
			let title = lines.shift().trim();

			// Use rest as entry text
			let text = lines.join('\n').trim();

			// Add title and text to existing entry if already is one for the same day
			if (indexDate in importObj) {
				const existingEntry = { ...importObj[indexDate] };
				if (existingEntry.title) {
					title = `${existingEntry.title} | ${title}`;
				}
				if (existingEntry.text) {
					text = `${existingEntry.text}\n\n----------\n\n${text}`;
				}
			}

			importObj[indexDate] = {
				dateUpdated: now,
				title,
				text
			};
		}
	});
	return importObj;
}
