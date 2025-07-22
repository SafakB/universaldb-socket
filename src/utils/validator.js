class Validator {
    static validateEventData(data) {
        const errors = [];
        
        if (!data) {
            errors.push('Event data is required');
            return { isValid: false, errors };
        }

        if (!data.timestamp) {
            errors.push('Timestamp is required');
        } else if (!this.isValidTimestamp(data.timestamp)) {
            errors.push('Invalid timestamp format');
        }

        if (!data.table) {
            errors.push('Table name is required');
        } else if (typeof data.table !== 'string' || data.table.trim() === '') {
            errors.push('Table name must be a non-empty string');
        }

        if (!data.action) {
            errors.push('Action is required');
        } else if (!['insert', 'update', 'delete'].includes(data.action)) {
            errors.push('Action must be one of: insert, update, delete');
        }

        if (data.record && typeof data.record !== 'object') {
            errors.push('Record must be an object');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static isValidTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date instanceof Date && !isNaN(date.getTime());
    }

    static validateChannel(channel) {
        if (!channel || typeof channel !== 'string') {
            return { isValid: false, error: 'Channel must be a non-empty string' };
        }

        // Basic channel format validation
        const validPatterns = [
            /^db$/,
            /^db\.[a-zA-Z_][a-zA-Z0-9_]*$/,
            /^db\.[a-zA-Z_][a-zA-Z0-9_]*\.(insert|update|delete)$/,
            /^db\.[a-zA-Z_][a-zA-Z0-9_]*\.(insert|update|delete)\.[0-9]+$/,
            /^db\.[a-zA-Z_][a-zA-Z0-9_]*\.\*\.[0-9]+$/,
            /^db\.\*\.(insert|update|delete)$/
        ];

        const isValid = validPatterns.some(pattern => pattern.test(channel));
        
        return {
            isValid,
            error: isValid ? null : 'Invalid channel format'
        };
    }
}

module.exports = Validator;