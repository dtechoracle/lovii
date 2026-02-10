package com.dtechoracle.lovii.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import com.dtechoracle.lovii.R
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

/**
 * Lovii Widget - Displays partner's latest note
 */
class LoviiWidget : AppWidgetProvider() {
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update all widget instances
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Called when the first widget is created
    }

    override fun onDisabled(context: Context) {
        // Called when the last widget is removed
    }
}

internal fun updateAppWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int
) {
    // Load widget data from SharedPreferences
    val widgetData = loadWidgetData(context)
    
    // Construct the RemoteViews object
    val views = RemoteViews(context.packageName, R.layout.lovii_widget)
    
    if (widgetData != null) {
        // Set content based on type
        when (widgetData.type) {
            "text" -> {
                views.setTextViewText(R.id.widget_title, "From Your Partner")
                views.setTextViewText(R.id.widget_content, widgetData.content)
                views.setTextViewText(R.id.widget_icon, "💬")
                views.setViewVisibility(R.id.widget_image, android.view.View.GONE)
            }
            "drawing", "collage" -> {
                views.setTextViewText(R.id.widget_title, "From Your Partner")
                 // Check if image data exists
                if (widgetData.images != null && widgetData.images.isNotEmpty()) {
                    try {
                        val base64Image = widgetData.images[0]
                        val decodedString = android.util.Base64.decode(base64Image, android.util.Base64.DEFAULT)
                        val bitmap = android.graphics.BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size)
                        
                        if (bitmap != null) {
                            views.setImageViewBitmap(R.id.widget_image, bitmap)
                            views.setViewVisibility(R.id.widget_image, android.view.View.VISIBLE)
                             views.setTextViewText(R.id.widget_content, "") // Hide text
                        } else {
                            views.setTextViewText(R.id.widget_content, if (widgetData.type == "drawing") "🎨 Drawing" else "📸 Collage")
                            views.setViewVisibility(R.id.widget_image, android.view.View.GONE)
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                        views.setTextViewText(R.id.widget_content, "Error loading image")
                        views.setViewVisibility(R.id.widget_image, android.view.View.GONE)
                    }
                } else {
                    views.setTextViewText(R.id.widget_content, if (widgetData.type == "drawing") "🎨 Drawing" else "📸 Collage")
                    views.setViewVisibility(R.id.widget_image, android.view.View.GONE)
                }
                
                views.setTextViewText(R.id.widget_icon, if (widgetData.type == "drawing") "🎨" else "📸")
            }
        }
        
        // Set timestamp
        val timeAgo = getTimeAgo(widgetData.timestamp)
        views.setTextViewText(R.id.widget_time, timeAgo)
    } else {
        // Empty state
        views.setTextViewText(R.id.widget_title, "Lovii")
        views.setTextViewText(R.id.widget_content, "No notes yet")
        views.setTextViewText(R.id.widget_icon, "❤️")
        views.setTextViewText(R.id.widget_time, "")
    }
    
    // Update the widget
    appWidgetManager.updateAppWidget(appWidgetId, views)
}

// Data class for widget data
data class WidgetData(
    val type: String,
    val content: String,
    val timestamp: Long,
    val color: String?,
    val images: List<String>?
)

// Load widget data from SharedPreferences
private fun loadWidgetData(context: Context): WidgetData? {
    try {
        val prefs: SharedPreferences = context.getSharedPreferences(
            "LoviiWidgetData",
            Context.MODE_PRIVATE
        )
        
        val jsonString = prefs.getString("latestNote", null) ?: return null
        val json = JSONObject(jsonString)
        
        return WidgetData(
            type = json.getString("type"),
            content = json.getString("content"),
            timestamp = json.getLong("timestamp"),
            color = json.optString("color", null),
            images = if (json.has("images")) {
                val imagesArray = json.getJSONArray("images")
                val list = mutableListOf<String>()
                for (i in 0 until imagesArray.length()) {
                    list.add(imagesArray.getString(i))
                }
                list
            } else null
        )
    } catch (e: Exception) {
        e.printStackTrace()
        return null
    }
}

// Calculate time ago string
private fun getTimeAgo(timestamp: Long): String {
    val now = System.currentTimeMillis()
    val diff = now - timestamp
    
    return when {
        diff < 60000 -> "Just now"
        diff < 3600000 -> "${diff / 60000}m ago"
        diff < 86400000 -> "${diff / 3600000}h ago"
        else -> "${diff / 86400000}d ago"
    }
}
