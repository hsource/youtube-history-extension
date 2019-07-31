export interface SidebarItem {
  searchBoxRenderer?: SearchBoxRenderer;
  subFeedSelectorRenderer?: SubFeedSelectorRenderer;
  buttonRenderer?: SidebarItemButtonRenderer;
}

export interface CancelButton {
  buttonRenderer: SidebarItemButtonRenderer;
}

export interface ConfirmDialogRenderer {
  title: TitleClass;
  confirmEndpoint: Endpoint;
  trackingParams: string;
  dialogMessages: DialogMessage[];
  confirmButton: ConfirmButton;
  cancelButton: CancelButton;
}

export interface Content {
  confirmDialogRenderer: ConfirmDialogRenderer;
}

export interface ConfirmDialogEndpoint {
  content: Content;
}

export interface ButtonRendererNavigationEndpoint {
  clickTrackingParams: string;
  commandMetadata: PurpleCommandMetadata;
  confirmDialogEndpoint?: ConfirmDialogEndpoint;
  urlEndpoint?: URLEndpoint;
}

export interface SidebarItemButtonRenderer {
  text: TitleClass;
  navigationEndpoint?: ButtonRendererNavigationEndpoint;
  trackingParams: string;
  style?: string;
  size?: string;
}

export interface ConfirmButton {
  buttonRenderer: ConfirmButtonButtonRenderer;
}

export interface ConfirmButtonButtonRenderer {
  style: string;
  size: string;
  text: PlaceholderTextClass;
  serviceEndpoint: Endpoint;
  trackingParams: string;
}

export interface Endpoint {
  clickTrackingParams: string;
  commandMetadata: ConfirmEndpointCommandMetadata;
  feedbackEndpoint: FeedbackEndpoint;
}

export interface ConfirmEndpointCommandMetadata {
  webCommandMetadata: FluffyWebCommandMetadata;
}

export interface FluffyWebCommandMetadata {
  url: string;
  sendPost: boolean;
}

export interface FeedbackEndpoint {
  feedbackToken: string;
  uiActions: UIActions;
  actions?: Action[];
}

export interface Action {
  openPopupAction: OpenPopupAction;
}

export interface OpenPopupAction {
  popup: Popup;
  popupType: string;
}

export interface Popup {
  notificationActionRenderer: NotificationActionRenderer;
}

export interface NotificationActionRenderer {
  responseText: TitleClass;
  trackingParams: string;
}

export interface TitleClass {
  runs: TextRun[];
}

export interface TextRun {
  text: string;
}

export interface UIActions {
  hideEnclosingContainer: boolean;
}

export interface PlaceholderTextClass {
  simpleText: string;
}

export interface DialogMessage {
  runs: DialogMessageRun[];
}

export interface DialogMessageRun {
  text: string;
  bold?: boolean;
  navigationEndpoint?: RunNavigationEndpoint;
}

export interface RunNavigationEndpoint {
  clickTrackingParams: string;
  commandMetadata: FluffyCommandMetadata;
  urlEndpoint: URLEndpoint;
}

export interface FluffyCommandMetadata {
  webCommandMetadata: TentacledWebCommandMetadata;
}

export interface TentacledWebCommandMetadata {
  url: string;
}

export interface URLEndpoint {
  url: string;
  target: string;
}

export interface PurpleCommandMetadata {
  webCommandMetadata: PurpleWebCommandMetadata;
}

export interface PurpleWebCommandMetadata {
  ignoreNavigation?: boolean;
  url?: string;
}

export interface SearchBoxRenderer {
  endpoint: EndpointClass;
  searchButton: Button;
  clearButton: Button;
  placeholderText: PlaceholderTextClass;
  trackingParams: string;
}

export interface Button {
  buttonRenderer: ClearButtonButtonRenderer;
}

export interface ClearButtonButtonRenderer {
  icon: Icon;
  navigationEndpoint?: EndpointClass;
  trackingParams: string;
  accessibilityData: ButtonRendererAccessibilityData;
}

export interface ButtonRendererAccessibilityData {
  accessibilityData: AccessibilityDataAccessibilityData;
}

export interface AccessibilityDataAccessibilityData {
  label: string;
}

export interface Icon {
  iconType: string;
}

export interface EndpointClass {
  clickTrackingParams: string;
  commandMetadata: EndpointCommandMetadata;
  browseEndpoint: EndpointBrowseEndpoint;
}

export interface EndpointBrowseEndpoint {
  browseId: string;
}

export interface EndpointCommandMetadata {
  webCommandMetadata: StickyWebCommandMetadata;
}

export interface StickyWebCommandMetadata {
  url: string;
  webPageType: string;
}

export interface SubFeedSelectorRenderer {
  title: TitleClass;
  options: Option[];
  trackingParams: string;
}

export interface Option {
  subFeedOptionRenderer: SubFeedOptionRenderer;
}

export interface SubFeedOptionRenderer {
  name: TitleClass;
  isSelected?: boolean;
  navigationEndpoint: SubFeedOptionRendererNavigationEndpoint;
  trackingParams: string;
}

export interface SubFeedOptionRendererNavigationEndpoint {
  clickTrackingParams: string;
  commandMetadata: EndpointCommandMetadata;
  browseEndpoint: PurpleBrowseEndpoint;
}

export interface PurpleBrowseEndpoint {
  browseId: string;
  params?: string;
}
