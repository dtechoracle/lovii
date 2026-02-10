//
//  LoviiWidget.swift
//  Lovii Widget Extension
//
//  Displays the latest note from your partner
//

import WidgetKit
import SwiftUI

// MARK: - Widget Data Model
struct WidgetData: Codable {
    let type: String  // "text", "drawing", "collage"
    let content: String
    let timestamp: Double
    let color: String?
    let images: [String]?
}

// MARK: - Timeline Provider
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), widgetData: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), widgetData: loadWidgetData())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        let entry = SimpleEntry(date: currentDate, widgetData: loadWidgetData())
        
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        
        completion(timeline)
    }
    
    // Load data from App Groups shared container
    private func loadWidgetData() -> WidgetData? {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.dtechoracle.lovii") else {
            return nil
        }
        
        guard let jsonString = sharedDefaults.string(forKey: "latestNote"),
              let jsonData = jsonString.data(using: .utf8) else {
            return nil
        }
        
        return try? JSONDecoder().decode(WidgetData.self, from: jsonData)
    }
}

// MARK: - Timeline Entry
struct SimpleEntry: TimelineEntry {
    let date: Date
    let widgetData: WidgetData?
}

// MARK: - Widget View
struct LoviiWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        ZStack {
            // Background
            Color(red: 0.11, green: 0.11, blue: 0.12) // #1C1C1E
            
            if let data = entry.widgetData {
                VStack(alignment: .leading, spacing: 12) {
                    // Header
                    HStack {
                        Image(systemName: iconForType(data.type))
                            .foregroundColor(Color(red: 1.0, green: 0.84, blue: 0.04)) // #FFD60A
                        
                        Text("From Your Partner")
                            .font(.caption)
                            .foregroundColor(.gray)
                        
                        Spacer()
                    }
                    
                    // Content
                if let images = data.images, !images.isEmpty,
                   let imageData = Data(base64Encoded: images[0]),
                   let uiImage = UIImage(data: imageData) {
                    
                    // Display Image
                    Image(uiImage: uiImage)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(height: 120)
                        .cornerRadius(8)
                        .clipped()
                    
                    if !data.content.isEmpty {
                         Text(data.content)
                            .font(.caption)
                            .foregroundColor(.white)
                            .lineLimit(2)
                    }
                } else {
                    // Fallback to text/icon if no image
                    if data.type == "text" {
                        Text(data.content)
                            .font(.body)
                            .foregroundColor(colorFromHex(data.color ?? "#FFFFFF"))
                            .lineLimit(4)
                    } else if data.type == "drawing" {
                        Text("🎨 Drawing")
                            .font(.title2)
                            .foregroundColor(.white)
                    } else if data.type == "collage" {
                        Text("📸 Collage")
                            .font(.title2)
                            .foregroundColor(.white)
                    }
                }
                
                Spacer()
                
                // Timestamp
                Text(timeAgo(from: data.timestamp))
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
            .padding()
        } else {
            // Empty state
            VStack(spacing: 8) {
                    Image(systemName: "heart.fill")
                        .font(.largeTitle)
                        .foregroundColor(Color(red: 1.0, green: 0.84, blue: 0.04))
                    
                    Text("No notes yet")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
        }
    }
    
    private func iconForType(_ type: String) -> String {
        switch type {
        case "text": return "text.bubble.fill"
        case "drawing": return "paintbrush.fill"
        case "collage": return "photo.fill"
        default: return "heart.fill"
        }
    }
    
    private func colorFromHex(_ hex: String) -> Color {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        r = (int >> 16) & 0xFF
        g = (int >> 8) & 0xFF
        b = int & 0xFF
        return Color(red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255)
    }
    
    private func timeAgo(from timestamp: Double) -> String {
        let date = Date(timeIntervalSince1970: timestamp / 1000)
        let seconds = Date().timeIntervalSince(date)
        
        if seconds < 60 {
            return "Just now"
        } else if seconds < 3600 {
            return "\(Int(seconds / 60))m ago"
        } else if seconds < 86400 {
            return "\(Int(seconds / 3600))h ago"
        } else {
            return "\(Int(seconds / 86400))d ago"
        }
    }
}

// MARK: - Widget Configuration
@main
struct LoviiWidget: Widget {
    let kind: String = "LoviiWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            LoviiWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Partner's Note")
        .description("See your partner's latest note, drawing, or collage.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview
struct LoviiWidget_Previews: PreviewProvider {
    static var previews: some View {
        LoviiWidgetEntryView(entry: SimpleEntry(
            date: Date(),
            widgetData: WidgetData(
                type: "text",
                content: "I love you! ❤️",
                timestamp: Date().timeIntervalSince1970 * 1000,
                color: "#FFD60A",
                images: nil
            )
        ))
        .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
