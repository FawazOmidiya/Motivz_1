import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTutorial } from "../../contexts/TutorialContext";
import { useNavigation } from "@react-navigation/native";
import * as Constants from "../../../constants/Constants";

const { width, height } = Dimensions.get("window");

export default function TutorialScreen() {
  const {
    currentStep,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
  } = useTutorial();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    if (currentStep === 5) {
      completeTutorial();
    } else {
      nextStep();
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      return;
    }
    previousStep();
  };

  const handleSkip = () => {
    completeTutorial();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <View style={styles.welcomeContent}>
            <Ionicons
              name="sparkles"
              size={80}
              color={Constants.purpleCOLOR}
              style={styles.welcomeIcon}
            />
            <Text style={styles.welcomeTitle}>Welcome to Motivz! 🎉</Text>
            <Text style={styles.welcomeDescription}>
              You're all set up! Let's take a quick tour to show you around the
              app.
            </Text>
          </View>
        );

      case 1: // Explore Events
        return (
          <View style={styles.exploreContainer}>
            {/* Search Bar */}
            <View style={styles.exploreSearchBar}>
              <View style={styles.exploreSearchInput}>
                <Text style={styles.exploreSearchText}>Find Friends...</Text>
              </View>
              <View style={styles.exploreSearchButton}>
                <Text style={styles.exploreSearchButtonText}>Search</Text>
              </View>
            </View>

            {/* Filter Section */}
            <View style={styles.exploreFilterContainer}>
              <View
                style={[styles.exploreFilterButton, styles.tutorialHighlight]}
              >
                <Ionicons
                  name="filter"
                  size={20}
                  color={Constants.whiteCOLOR}
                />
                <Text style={styles.exploreFilterText}>Filter Events</Text>
              </View>
            </View>

            {/* Events Grid */}
            <View style={styles.exploreEventsGrid}>
              <View style={styles.exploreEventRow}>
                <View
                  style={[styles.exploreEventCard, styles.tutorialHighlight]}
                >
                  <Image
                    source={require("../../../assets/tutorial/event-poster.jpg")}
                    style={styles.exploreEventImage}
                  />
                  <View style={styles.exploreEventInfo}>
                    <Text style={styles.exploreEventTitle}>
                      Friday Night Vibes
                    </Text>
                    <Text style={styles.exploreEventLocation}>Club XYZ</Text>
                    <Text style={styles.exploreEventDate}>Fri, Dec 15</Text>
                  </View>
                </View>
                <View style={styles.exploreEventCard}>
                  <Image
                    source={require("../../../assets/tutorial/night-club-party-poster-flyer-template-design-e5572c8a0a920315b03c6d19f7a247cb_screen.jpg")}
                    style={styles.exploreEventImage}
                  />
                  <View style={styles.exploreEventInfo}>
                    <Text style={styles.exploreEventTitle}>
                      Saturday Sessions
                    </Text>
                    <Text style={styles.exploreEventLocation}>Venue ABC</Text>
                    <Text style={styles.exploreEventDate}>Sat, Dec 16</Text>
                  </View>
                </View>
              </View>
              <View style={styles.exploreEventRow}>
                <View style={styles.exploreEventCard}>
                  <Image
                    source={require("../../../assets/tutorial/event-poster-2.jpg")}
                    style={styles.exploreEventImage}
                  />
                  <View style={styles.exploreEventInfo}>
                    <Text style={styles.exploreEventTitle}>Sunday Funday</Text>
                    <Text style={styles.exploreEventLocation}>Bar 123</Text>
                    <Text style={styles.exploreEventDate}>Sun, Dec 17</Text>
                  </View>
                </View>
                <View style={styles.exploreEventCard}>
                  <Image
                    source={require("../../../assets/tutorial/event-poster-3.jpg")}
                    style={styles.exploreEventImage}
                  />
                  <View style={styles.exploreEventInfo}>
                    <Text style={styles.exploreEventTitle}>Monday Madness</Text>
                    <Text style={styles.exploreEventLocation}>Club 456</Text>
                    <Text style={styles.exploreEventDate}>Mon, Dec 18</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      case 2: // EventDetail with Ticketing
        return (
          <View style={styles.eventDetailContainer}>
            {/* Event Header with Poster */}
            <View style={styles.eventDetailHeader}>
              <Image
                source={require("../../../assets/tutorial/event-poster.jpg")}
                style={styles.eventDetailPoster}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={styles.eventDetailGradient}
              />
              <TouchableOpacity style={styles.eventDetailBackButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Event Content */}
            <View style={styles.eventDetailContent}>
              {/* Event Title with Share Button */}
              <View style={[styles.eventDetailTitleRow]}>
                <Text style={styles.eventDetailTitle}>Friday Night Vibes</Text>
                <TouchableOpacity style={styles.eventDetailShareButton}>
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={Constants.purpleCOLOR}
                  />
                </TouchableOpacity>
              </View>

              {/* Event Info */}
              <View style={styles.eventDetailInfo}>
                <View style={styles.eventDetailInfoRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={Constants.purpleCOLOR}
                  />
                  <Text style={styles.eventDetailInfoText}>
                    Fri, Dec 15 • 9:00 PM
                  </Text>
                </View>
                <View
                  style={[styles.eventDetailInfoRow, styles.tutorialHighlight]}
                >
                  <Ionicons
                    name="location"
                    size={18}
                    color={Constants.purpleCOLOR}
                  />
                  <Text style={styles.eventDetailInfoText}>Club XYZ</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                </View>
                <View style={styles.eventDetailInfoRow}>
                  <Ionicons
                    name="musical-notes"
                    size={18}
                    color={Constants.purpleCOLOR}
                  />
                  <Text style={styles.eventDetailInfoText}>
                    Hip-Hop, R&B, Afrobeats
                  </Text>
                </View>
              </View>

              {/* Attendance Info */}
              <View style={styles.eventDetailAttendance}>
                <View style={styles.eventDetailAttendanceInfo}>
                  <Text style={styles.eventDetailAttendanceText}>
                    127 people are going
                  </Text>
                </View>

                {/* Friends attending */}
                <View style={styles.eventDetailFriendsAttending}>
                  <Text style={styles.eventDetailFriendsLabel}>
                    Your friends:
                  </Text>
                  <View style={styles.eventDetailFriendsAvatars}>
                    <Image
                      source={require("../../../assets/tutorial/profile-1.jpg")}
                      style={styles.eventDetailFriendAvatar}
                    />
                    <Image
                      source={require("../../../assets/tutorial/profile-2.png")}
                      style={styles.eventDetailFriendAvatar}
                    />
                    <Image
                      source={require("../../../assets/tutorial/profile-3.jpg")}
                      style={styles.eventDetailFriendAvatar}
                    />
                    <View style={styles.eventDetailMoreFriends}>
                      <Text style={styles.eventDetailMoreFriendsText}>+2</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Ticket Button */}
              <TouchableOpacity style={styles.eventDetailTicketButton}>
                <Ionicons name="ticket" size={20} color="#fff" />
                <Text style={styles.eventDetailTicketButtonText}>
                  Get Tickets / Guestlist
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3: // Friends Search
        return (
          <View style={styles.exploreContainer}>
            {/* Search Bar */}
            <View style={styles.exploreSearchBar}>
              <View style={styles.exploreSearchInput}>
                <Text style={styles.exploreSearchText}>Find Friends...</Text>
              </View>
              <View style={styles.exploreSearchButton}>
                <Text style={styles.exploreSearchButtonText}>Search</Text>
              </View>
            </View>

            {/* Search Results Overlay */}
            <View style={styles.exploreSearchOverlay}>
              <View style={styles.exploreSearchResults}>
                <View
                  style={[styles.exploreUserItem, styles.tutorialHighlight]}
                >
                  <Image
                    source={require("../../../assets/tutorial/profile-1.jpg")}
                    style={styles.exploreUserAvatar}
                  />
                  <Text style={styles.exploreUserName}>sarah_chen</Text>
                </View>

                <View style={styles.exploreUserItem}>
                  <Image
                    source={require("../../../assets/tutorial/profile-2.png")}
                    style={styles.exploreUserAvatar}
                  />
                  <Text style={styles.exploreUserName}>mike_davis</Text>
                </View>

                <View style={styles.exploreUserItem}>
                  <Image
                    source={require("../../../assets/tutorial/profile-3.jpg")}
                    style={styles.exploreUserAvatar}
                  />
                  <Text style={styles.exploreUserName}>alex_johnson</Text>
                </View>

                <View style={styles.exploreUserItem}>
                  <Image
                    source={require("../../../assets/tutorial/profile-4.jpg")}
                    style={styles.exploreUserAvatar}
                  />
                  <Text style={styles.exploreUserName}>jasmine_lee</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 4: // Reviews
        return (
          <View style={styles.clubDetailContainer}>
            {/* Club Header */}
            <View style={styles.clubHeader}>
              <Image
                source={require("../../../assets/tutorial/club-banner.jpg")}
                style={styles.clubBanner}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.clubHeaderGradient}
              />
              <View style={styles.clubHeaderContent}>
                <Text style={styles.clubName}>Marilyn's</Text>
                <Text style={styles.clubAddress}>123 Main St, City</Text>
                <View style={styles.clubRating}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.clubRatingText}>4.5</Text>
                </View>
                <View style={styles.clubGenres}>
                  <Ionicons
                    name="musical-notes"
                    size={14}
                    color="rgba(255, 255, 255, 0.8)"
                  />
                  <Text style={styles.clubGenresText}>
                    House, Techno, Deep House
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.clubActionButtons}>
              <TouchableOpacity style={styles.clubActionButton}>
                <Ionicons name="logo-instagram" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.clubActionButton}>
                <Ionicons name="logo-google" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.clubActionButton}>
                <Ionicons name="car-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.clubScheduleButton}>
                <Ionicons name="time-outline" size={20} color="#fff" />
                <Text style={styles.clubScheduleText}>Open until 2 AM</Text>
              </TouchableOpacity>
            </View>

            {/* Review Toggle */}
            <View style={styles.clubToggleContainer}>
              <TouchableOpacity
                style={[styles.clubToggleButton, styles.clubToggleActive]}
              >
                <Text
                  style={[styles.clubToggleText, styles.clubToggleTextActive]}
                >
                  Live Reviews
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clubToggleButton}>
                <Text style={styles.clubToggleText}>All Reviews</Text>
              </TouchableOpacity>
            </View>

            {/* Reviews Section */}
            <View style={styles.clubReviewsSection}>
              <View style={styles.clubReviewsHeader}>
                <Text style={styles.clubSectionTitle}>Live Reviews</Text>
                <TouchableOpacity
                  style={[
                    styles.clubWriteReviewButton,
                    styles.tutorialHighlight,
                  ]}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={Constants.purpleCOLOR}
                  />
                  <Text style={styles.clubWriteReviewText}>Write Review</Text>
                </TouchableOpacity>
              </View>

              {/* Mock Reviews */}
              <View style={styles.clubReviewList}>
                <View style={styles.clubReviewItem}>
                  <View style={styles.clubReviewHeader}>
                    <Image
                      source={require("../../../assets/tutorial/profile-1.jpg")}
                      style={styles.clubReviewAvatar}
                    />
                    <View style={styles.clubReviewInfo}>
                      <Text style={styles.clubReviewName}>Sarah C.</Text>
                      <View style={styles.clubReviewRating}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.clubReviewTime}>
                          30 minutes ago
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.clubReviewText}>
                    Amazing vibes tonight! The DJ is incredible and the crowd is
                    so energetic. Pull up!
                  </Text>
                  <View style={styles.clubReviewGenres}>
                    <Ionicons
                      name="musical-notes"
                      size={12}
                      color={Constants.purpleCOLOR}
                    />
                    <Text style={styles.clubReviewGenresText}>
                      House, Techno
                    </Text>
                  </View>
                </View>

                <View style={styles.clubReviewItem}>
                  <View style={styles.clubReviewHeader}>
                    <Image
                      source={require("../../../assets/tutorial/profile-2.png")}
                      style={styles.clubReviewAvatar}
                    />
                    <View style={styles.clubReviewInfo}>
                      <Text style={styles.clubReviewName}>Mike D.</Text>
                      <View style={styles.clubReviewRating}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Ionicons
                          name="star-outline"
                          size={12}
                          color="#FFD700"
                        />
                        <Text style={styles.clubReviewTime}>4 hours ago</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.clubReviewText}>
                    Great atmosphere and friendly staff. The music selection was
                    perfect for the crowd.
                  </Text>
                  <View style={styles.clubReviewGenres}>
                    <Ionicons
                      name="musical-notes"
                      size={12}
                      color={Constants.purpleCOLOR}
                    />
                    <Text style={styles.clubReviewGenresText}>
                      Deep House, Progressive
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      case 4: // Reviews
        return (
          <View style={styles.eventDetailContainer}>
            {/* Event Header with Poster */}
            <View style={styles.eventDetailHeader}>
              <Image
                source={require("../../../assets/tutorial/event-poster.jpg")}
                style={styles.eventDetailPoster}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={styles.eventDetailGradient}
              />
              <TouchableOpacity style={styles.eventDetailBackButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Event Content */}
            <View style={styles.eventDetailContent}>
              {/* Event Title with Share Button */}
              <View style={styles.eventDetailTitleRow}>
                <Text style={styles.eventDetailTitle}>Friday Night Vibes</Text>
                <TouchableOpacity style={styles.eventDetailShareButton}>
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={Constants.purpleCOLOR}
                  />
                </TouchableOpacity>
              </View>

              {/* Event Info */}
              <View style={styles.eventDetailInfo}>
                <View style={styles.eventDetailInfoRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={Constants.purpleCOLOR}
                  />
                  <Text style={styles.eventDetailInfoText}>
                    Fri, Dec 15 • 9:00 PM
                  </Text>
                </View>
                <View style={styles.eventDetailInfoRow}>
                  <Ionicons
                    name="location"
                    size={18}
                    color={Constants.purpleCOLOR}
                  />
                  <Text style={styles.eventDetailInfoText}>Club XYZ</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                </View>
                <View style={styles.eventDetailInfoRow}>
                  <Ionicons
                    name="musical-notes"
                    size={18}
                    color={Constants.purpleCOLOR}
                  />
                  <Text style={styles.eventDetailInfoText}>
                    Hip-Hop, R&B, Afrobeats
                  </Text>
                </View>
              </View>

              {/* Attendance Info */}
              <View style={styles.eventDetailAttendance}>
                <View style={styles.eventDetailAttendanceInfo}>
                  <Text style={styles.eventDetailAttendanceText}>
                    127 people are going
                  </Text>
                </View>

                {/* Friends attending */}
                <View style={styles.eventDetailFriendsAttending}>
                  <Text style={styles.eventDetailFriendsLabel}>
                    Your friends:
                  </Text>
                  <View style={styles.eventDetailFriendsAvatars}>
                    <Image
                      source={require("../../../assets/tutorial/profile-1.jpg")}
                      style={styles.eventDetailFriendAvatar}
                    />
                    <Image
                      source={require("../../../assets/tutorial/profile-2.png")}
                      style={styles.eventDetailFriendAvatar}
                    />
                    <Image
                      source={require("../../../assets/tutorial/profile-3.jpg")}
                      style={styles.eventDetailFriendAvatar}
                    />
                    <View style={styles.eventDetailMoreFriends}>
                      <Text style={styles.eventDetailMoreFriendsText}>+2</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Ticket Button */}
              <TouchableOpacity
                style={[
                  styles.eventDetailTicketButton,
                  styles.tutorialHighlight,
                ]}
              >
                <Ionicons name="ticket" size={20} color="#fff" />
                <Text style={styles.eventDetailTicketButtonText}>
                  Get Tickets / Guestlist
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 5: // Complete
        return (
          <View style={styles.welcomeContent}>
            <Ionicons
              name="rocket"
              size={80}
              color={Constants.purpleCOLOR}
              style={styles.welcomeIcon}
            />
            <Text style={styles.welcomeTitle}>You're All Set! 🚀</Text>
            <Text style={styles.welcomeDescription}>
              You now know the basics of Motivz! Start exploring events,
              connecting with friends, and having amazing nights out.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const getStepInfo = () => {
    const steps = [
      {
        skipable: true,
      },
      {
        title: "Find the MOTIVZ 🔍",
        description:
          "Discover events happening around you. Filter by music genre, or search for specific events to find your perfect night out every time.",
        skipable: false,
      },
      {
        title: "Purchase Tickets & See Who's Going 🎫",
        description:
          "Get tickets directly in the app for any event! See all the details like music genres, venue info, and how many people are going.",
        skipable: false,
      },
      {
        title: "Find Your Friends 👥",
        description:
          "Connect with friends to see what events they're attending. The more friends you have, the better your recommendations!",
        skipable: false,
      },
      {
        title: "Leave Live Reviews ⭐",
        description: "MOTIVZ_STYLED",
        skipable: false,
      },
      {
        skipable: false,
      },
    ];
    return steps[currentStep];
  };

  const stepInfo = getStepInfo();
  const progress = ((currentStep + 1) / 6) * 100;

  // Special layout for step 3 (Friends Search screen) - text at top, buttons at bottom
  if (currentStep === 2) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Tutorial content */}
        {renderStepContent()}

        {/* Tutorial text and progress at top for step 5 */}
        <View style={[styles.tutorialTextTop, { paddingTop: insets.top + 10 }]}>
          <View style={styles.progressContainerCompact}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressTextCompact}>
              Step {currentStep + 1} of 6
            </Text>
          </View>

          {/* Only show tutorial text for steps 2-5 */}
          {currentStep > 0 && currentStep < 5 && (
            <View style={styles.stepContentCompact}>
              <Text style={styles.titleCompact}>{stepInfo.title}</Text>
              {stepInfo.description === "MOTIVZ_STYLED" ? (
                <Text style={styles.descriptionCompact}>
                  Share your experience at clubs with live reviews! See what the
                  vibes are right now and find your{" "}
                  <Text style={styles.motivzTextCompact}>MOTIVZ</Text>.
                </Text>
              ) : (
                <Text style={styles.descriptionCompact}>
                  {stepInfo.description}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Navigation buttons at bottom for step 5 */}
        <View
          style={[
            styles.tutorialButtonsBottom,
            { paddingBottom: insets.bottom + 10 },
          ]}
        >
          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={Constants.purpleCOLOR}
                />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <View style={styles.primaryButtons}>
              {stepInfo.skipable && currentStep > 0 && currentStep < 4 && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {currentStep === 4 ? "Get Started" : "Next"}
                </Text>
                <Ionicons
                  name={currentStep === 4 ? "rocket" : "chevron-forward"}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Default layout for all other steps
  return (
    <SafeAreaView style={styles.container}>
      {/* Tutorial content */}
      {renderStepContent()}

      {/* Tutorial overlay */}
      <View style={styles.tutorialOverlay}>
        <View style={styles.tutorialCard}>
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>Step {currentStep + 1} of 6</Text>
          </View>

          {/* Only show tutorial text for steps 2-5 */}
          {currentStep > 0 && currentStep < 5 && (
            <View style={styles.stepContent}>
              {currentStep === 1 ? (
                <Text style={styles.title}>
                  Find the <Text style={styles.motivzTitleText}>MOTIVZ</Text> 🔍
                </Text>
              ) : (
                <Text style={styles.title}>{stepInfo.title}</Text>
              )}
              {stepInfo.description === "MOTIVZ_STYLED" ? (
                <Text style={styles.description}>
                  Share your experience at clubs with live reviews! See what the
                  vibes are right now and find your{" "}
                  <Text style={styles.motivzText}>MOTIVZ</Text>.
                </Text>
              ) : stepInfo.description === "BRANDED_EXPLORE" ? (
                <Text style={styles.description}>
                  Discover amazing events happening around you. Filter by music
                  genre, date, or search for specific events to find your{" "}
                  <Text style={styles.motivzText}>MOTIVZ</Text>.
                </Text>
              ) : (
                <Text style={styles.description}>{stepInfo.description}</Text>
              )}
            </View>
          )}

          {/* Navigation buttons */}
          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={Constants.purpleCOLOR}
                />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <View style={styles.primaryButtons}>
              {stepInfo.skipable && currentStep > 0 && currentStep < 4 && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {currentStep === 5 ? "Get Started" : "Next"}
                </Text>
                <Ionicons
                  name={currentStep === 5 ? "rocket" : "chevron-forward"}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  welcomeIcon: {
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  welcomeDescription: {
    fontSize: 18,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 24,
  },
  mockApp: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  mockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Constants.blackCOLOR,
  },
  mockHeaderText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  mockSearchBar: {
    backgroundColor: "#333",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
  },
  mockSearchText: {
    color: "#999",
    fontSize: 16,
  },
  mockEventList: {
    paddingHorizontal: 20,
    flex: 1,
  },
  mockEventCard: {
    flexDirection: "row",
    backgroundColor: "#333",
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  trendingEvent: {
    borderColor: "#ff6b35",
    borderWidth: 2,
  },
  mockEventImage: {
    width: 60,
    height: 60,
    backgroundColor: "#555",
    borderRadius: 8,
    marginRight: 15,
  },
  mockEventInfo: {
    flex: 1,
  },
  mockEventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  mockEventLocation: {
    fontSize: 14,
    color: "#ccc",
  },
  trendingText: {
    fontSize: 12,
    color: "#ff6b35",
    marginTop: 5,
  },
  mockFriendsList: {
    paddingHorizontal: 20,
    flex: 1,
  },
  mockFriendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
  },
  mockAvatar: {
    width: 50,
    height: 50,
    backgroundColor: "#555",
    borderRadius: 25,
    marginRight: 15,
  },
  mockFriendInfo: {
    flex: 1,
  },
  mockFriendName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  mockFriendStatus: {
    fontSize: 14,
    color: "#ccc",
  },
  mockEventDetail: {
    flex: 1,
    padding: 20,
  },
  mockEventPoster: {
    width: "100%",
    height: 200,
    backgroundColor: "#555",
    borderRadius: 12,
    marginBottom: 20,
  },
  mockEventDetails: {
    marginBottom: 30,
  },
  mockEventDate: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 5,
  },
  mockAttendanceButton: {
    backgroundColor: Constants.purpleCOLOR,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  mockButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  tutorialOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingTop: 20,
    paddingBottom: 20,
  },
  tutorialCard: {
    backgroundColor: "#1a1a1a",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 2,
  },
  progressText: {
    color: "#ccc",
    fontSize: 14,
    textAlign: "center",
  },
  stepContent: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 15,
  },
  actionContainer: {
    backgroundColor: "rgba(138, 43, 226, 0.1)",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Constants.purpleCOLOR,
  },
  actionText: {
    color: Constants.purpleCOLOR,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    minHeight: 50,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(138, 43, 226, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Constants.purpleCOLOR,
  },
  backButtonText: {
    color: Constants.purpleCOLOR,
    fontSize: 16,
    marginLeft: 5,
    fontWeight: "500",
  },
  primaryButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  skipButtonText: {
    color: "#ccc",
    fontSize: 16,
    fontWeight: "500",
  },
  nextButton: {
    backgroundColor: Constants.purpleCOLOR,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 120,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  // Explore Screen Styles (matching actual ExploreScreen)
  exploreContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: Constants.backgroundCOLOR,
  },
  exploreSearchBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  exploreSearchInput: {
    flex: 1,
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    justifyContent: "center",
  },
  exploreSearchText: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
  },
  exploreSearchButton: {
    marginLeft: 10,
    backgroundColor: Constants.purpleCOLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exploreSearchButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  exploreFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  exploreFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Constants.greyCOLOR,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  exploreFilterText: {
    color: Constants.whiteCOLOR,
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  exploreEventsGrid: {
    paddingTop: 20,
  },
  exploreEventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  exploreEventCard: {
    width: (width - 48) / 2,
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 12,
    overflow: "hidden",
  },
  exploreEventImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#555",
  },
  exploreEventInfo: {
    padding: 12,
  },
  exploreEventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  exploreEventLocation: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 2,
  },
  exploreEventDate: {
    fontSize: 12,
    color: Constants.purpleCOLOR,
    fontWeight: "500",
  },
  // Search Results Styles (matching actual ExploreScreen search results)
  exploreSearchOverlay: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: Constants.backgroundCOLOR,
    borderRadius: 8,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  exploreSearchResults: {
    paddingVertical: 10,
  },
  exploreUserItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: Constants.greyCOLOR,
    marginBottom: 10,
    borderRadius: 8,
  },
  exploreUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#555",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  exploreUserInitial: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  exploreUserName: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
    fontWeight: "500",
  },
  // Profile Screen Styles (matching actual ProfileScreen)
  profileContainer: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  profileHeaderGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  profileHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: Constants.backgroundCOLOR,
    alignItems: "center",
    zIndex: 2,
  },
  profileHeaderRow: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  profileAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: Constants.greyCOLOR,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Constants.purpleCOLOR,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatarInitial: {
    fontSize: 48,
    color: Constants.whiteCOLOR,
    fontWeight: "600",
  },
  profileUsername: {
    fontSize: 18,
    color: Constants.whiteCOLOR,
    marginBottom: 16,
    fontWeight: "500",
  },
  profileButtonsContainer: {
    width: "100%",
  },
  profileNameAndButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  profileNameContainer: {
    flex: 1,
  },
  profileFirstName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
  profileLastName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
  profileButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileIconButtonContainer: {
    position: "relative",
    marginRight: 16,
  },
  profileIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  profileBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  profileBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  profileSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  profileFavouritesList: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  profileFavouriteItem: {
    alignItems: "center",
    marginRight: 18,
    width: 80,
  },
  profileFavouriteImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
    backgroundColor: Constants.greyCOLOR,
  },
  profileFavouriteName: {
    color: Constants.whiteCOLOR,
    fontSize: 13,
    textAlign: "center",
    width: 70,
  },
  // Club Detail Screen Styles (matching actual ClubDetail)
  clubDetailContainer: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  clubHeader: {
    position: "relative",
    height: 200,
  },
  clubBanner: {
    width: "100%",
    height: "100%",
  },
  clubHeaderGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  clubHeaderContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  clubName: {
    fontSize: 28,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  clubAddress: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  clubRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  clubRatingText: {
    fontSize: 14,
    color: Constants.whiteCOLOR,
    marginLeft: 4,
  },
  clubActionButtons: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  clubActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Constants.greyCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  clubScheduleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Constants.greyCOLOR,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
  clubScheduleText: {
    color: Constants.whiteCOLOR,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  clubToggleContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 8,
    padding: 4,
  },
  clubToggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  clubToggleActive: {
    backgroundColor: Constants.purpleCOLOR,
  },
  clubToggleText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  clubToggleTextActive: {
    color: Constants.whiteCOLOR,
    fontWeight: "600",
  },
  clubReviewsSection: {
    paddingHorizontal: 20,
  },
  clubReviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  clubSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
  clubWriteReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 69, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Constants.purpleCOLOR,
  },
  clubWriteReviewText: {
    color: Constants.purpleCOLOR,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  clubReviewList: {
    gap: 16,
  },
  clubReviewItem: {
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 12,
    padding: 16,
  },
  clubReviewHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  clubReviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#555",
    marginRight: 12,
  },
  clubReviewInfo: {
    flex: 1,
  },
  clubReviewName: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 4,
  },
  clubReviewRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  clubReviewTime: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginLeft: 8,
  },
  clubReviewText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  clubGenres: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  clubGenresText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginLeft: 6,
  },
  clubReviewGenres: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  clubReviewGenresText: {
    fontSize: 12,
    color: Constants.purpleCOLOR,
    marginLeft: 4,
    fontWeight: "500",
  },
  // Event Detail Screen Styles (matching actual EventDetail)
  eventDetailContainer: {
    flex: 1,
    backgroundColor: Constants.backgroundCOLOR,
  },
  eventDetailHeader: {
    position: "relative",
    height: 300,
  },
  eventDetailPoster: {
    width: "100%",
    height: "100%",
  },
  eventDetailGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  eventDetailBackButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  eventDetailContent: {
    padding: 20,
  },
  eventDetailTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  eventDetailTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    flex: 1,
  },
  eventDetailShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 69, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  eventDetailInfo: {
    marginBottom: 20,
  },
  eventDetailInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eventDetailInfoText: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
    marginLeft: 12,
    flex: 1,
  },
  eventDetailAttendance: {
    backgroundColor: Constants.greyCOLOR,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  eventDetailAttendanceInfo: {
    marginBottom: 12,
  },
  eventDetailAttendanceText: {
    fontSize: 16,
    color: Constants.whiteCOLOR,
    fontWeight: "500",
  },
  eventDetailFriendsAttending: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventDetailFriendsLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginRight: 12,
  },
  eventDetailFriendsAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventDetailFriendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#555",
    marginRight: -8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Constants.backgroundCOLOR,
  },
  eventDetailFriendInitial: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  eventDetailMoreFriends: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Constants.purpleCOLOR,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Constants.backgroundCOLOR,
  },
  eventDetailMoreFriendsText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  eventDetailTicketButton: {
    backgroundColor: Constants.purpleCOLOR,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventDetailTicketButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  eventDetailAttendanceToggle: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  eventDetailAttendanceToggleText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  // Special layout styles for step 5 (EventDetail screen)
  tutorialTextTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  tutorialButtonsBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingTop: 15,
    paddingHorizontal: 20,
    zIndex: 1000,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  // Compact styles for step 5 top section
  progressContainerCompact: {
    marginBottom: 8,
  },
  progressTextCompact: {
    color: Constants.whiteCOLOR,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  stepContentCompact: {
    alignItems: "center",
  },
  titleCompact: {
    fontSize: 18,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
    textAlign: "center",
    marginBottom: 4,
  },
  descriptionCompact: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 18,
  },
  motivzText: {
    color: Constants.purpleCOLOR,
    fontSize: 20,
    fontWeight: "bold",
  },
  motivzTextCompact: {
    color: Constants.purpleCOLOR,
    fontSize: 28,
    fontWeight: "bold",
  },
  motivzTitleText: {
    color: Constants.purpleCOLOR,
    fontSize: 32,
    fontWeight: "bold",
  },
  motivzTitleTextCompact: {
    color: Constants.purpleCOLOR,
    fontSize: 32,
    fontWeight: "bold",
  },
  titlePurple: {
    fontSize: 24,
    fontWeight: "bold",
    color: Constants.purpleCOLOR,
    textAlign: "center",
    marginBottom: 10,
  },
  titlePurpleCompact: {
    fontSize: 18,
    fontWeight: "bold",
    color: Constants.purpleCOLOR,
    textAlign: "center",
    marginBottom: 4,
  },
  tutorialHighlight: {
    borderWidth: 3,
    borderColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
});
