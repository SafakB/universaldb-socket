const logger = require('../utils/logger');
const Validator = require('../utils/validator');

class EventService {
    static publishDbChange(io, data) {
        try {
            const validation = Validator.validateEventData(data);
            if (!validation.isValid) {
                throw new Error(`Invalid event data: ${validation.errors.join(', ')}`);
            }

            const { timestamp, table, action, record } = data;
            
            logger.info(`Publishing dbChange: [${timestamp}] ${table}.${action}`, {
                table,
                action,
                recordId: record?.id
            });

            // Hiyerarşik event publishing
            const events = this.generateEventChannels(table, action, record);
            
            events.forEach(({ channel, eventName }) => {
                io.to(channel).emit(eventName, data);
            });

            return { success: true, eventsPublished: events.length };
        } catch (error) {
            logger.error('Failed to publish dbChange:', error);
            throw error;
        }
    }

    static generateEventChannels(table, action, record) {
        const events = [
            { channel: 'db', eventName: 'db' },
            { channel: `db.${table}`, eventName: `db.${table}` },
            { channel: `db.${table}.${action}`, eventName: `db.${table}.${action}` },
            { channel: `db.*.${action}`, eventName: `db.*.${action}` }
        ];

        if (record?.id !== undefined) {
            events.push(
                { channel: `db.${table}.${action}.${record.id}`, eventName: `db.${table}.${action}.${record.id}` },
                { channel: `db.${table}.*.${record.id}`, eventName: `db.${table}.*.${record.id}` }
            );
        }

        return events;
    }
}

module.exports = EventService;