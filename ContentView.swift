
import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = RepairViewModel()
    
    var body: some View {
        TabView {
            HomeView(viewModel: viewModel)
                .tabItem {
                    Label("Explore", systemImage: "house.fill")
                }
            
            SearchView(viewModel: viewModel)
                .tabItem {
                    Label("Search", systemImage: "magnifyingglass")
                }
            
            ProfileView(viewModel: viewModel)
                .tabItem {
                    Label("My Repairs", systemImage: "person.fill")
                }
        }
        .accentColor(.blue)
    }
}

#Preview {
    ContentView()
}
