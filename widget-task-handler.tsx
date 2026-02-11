import { StorageService } from '@/services/storage';
import React from 'react';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { AndroidWidget } from './components/AndroidWidget';

const WIDGET_NAME = 'LoviiWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
    const widgetInfo = props.widgetInfo;
    const widgetName = widgetInfo.widgetName;

    if (widgetName === WIDGET_NAME) {
        // Fetch latest note from storage
        const latestNote = await StorageService.getLatestPartnerNote();

        props.renderWidget(
            <AndroidWidget
                content={latestNote?.content || 'Tap to send a note!'}
                type={latestNote?.type || 'text'}
                timestamp={latestNote?.timestamp || Date.now()}
                color={latestNote?.color}
            />
        );
    }
}
