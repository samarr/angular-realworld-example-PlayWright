import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import ArticleComponent from "./article.component";
import { ArticlesService } from "../../services/articles.service";
import { CommentsService } from "../../services/comments.service";
import { UserService } from "../../../../core/auth/services/user.service";
import { Article } from "../../models/article.model";
import { Comment } from "../../models/comment.model";
import { User } from "../../../../core/auth/user.model";
import { Profile } from "../../../profile/models/profile.model";

describe("ArticleComponent", () => {
  let component: ArticleComponent;
  let fixture: ComponentFixture<ArticleComponent>;
  let mockArticlesService: jasmine.SpyObj<ArticlesService>;
  let mockCommentsService: jasmine.SpyObj<CommentsService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const mockArticle: Article = {
    slug: "test-article",
    title: "Test Article",
    description: "Test Description",
    body: "Test Body",
    tagList: ["test"],
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
    favorited: false,
    favoritesCount: 0,
    author: {
      username: "testuser",
      bio: "Test Bio",
      image: "test.jpg",
      following: false,
    },
  };

  const mockComment: Comment = {
    id: "1",
    body: "Test Comment",
    createdAt: "2025-01-01",
    author: {
      username: "commenter",
      bio: "Commenter Bio",
      image: "commenter.jpg",
      following: false,
    },
  };

  const mockUser: User = {
    email: "test@test.com",
    token: "test-token",
    username: "testuser",
    bio: "Test Bio",
    image: "test.jpg",
  };

  beforeEach(async () => {
    mockArticlesService = jasmine.createSpyObj("ArticlesService", [
      "get",
      "delete",
    ]);
    mockCommentsService = jasmine.createSpyObj("CommentsService", [
      "getAll",
      "add",
      "delete",
    ]);
    mockUserService = jasmine.createSpyObj("UserService", [], {
      currentUser: of(mockUser),
    });
    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);
    mockActivatedRoute = {
      snapshot: {
        params: { slug: "test-article" },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ArticleComponent],
      providers: [
        { provide: ArticlesService, useValue: mockArticlesService },
        { provide: CommentsService, useValue: mockCommentsService },
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArticleComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should load article, comments, and user data on initialization", () => {
      // Arrange
      mockArticlesService.get.and.returnValue(of(mockArticle));
      mockCommentsService.getAll.and.returnValue(of([mockComment]));

      // Act
      component.ngOnInit();

      // Assert
      expect(mockArticlesService.get).toHaveBeenCalledWith("test-article");
      expect(mockCommentsService.getAll).toHaveBeenCalledWith("test-article");
      expect(component.article).toEqual(mockArticle);
      expect(component.comments).toEqual([mockComment]);
      expect(component.currentUser).toEqual(mockUser);
      expect(component.canModify).toBe(true); // user owns the article
    });
  });

  describe("onToggleFavorite", () => {
    beforeEach(() => {
      component.article = { ...mockArticle };
    });

    it("should increment favorites count when favorited", () => {
      // Arrange
      const initialCount = component.article.favoritesCount;

      // Act
      component.onToggleFavorite(true);

      // Assert
      expect(component.article.favorited).toBe(true);
      expect(component.article.favoritesCount).toBe(initialCount + 1);
    });

    it("should decrement favorites count when unfavorited", () => {
      // Arrange
      component.article.favoritesCount = 5;
      component.article.favorited = true;

      // Act
      component.onToggleFavorite(false);

      // Assert
      expect(component.article.favorited).toBe(false);
      expect(component.article.favoritesCount).toBe(4);
    });
  });

  describe("toggleFollowing", () => {
    it("should update article author following status", () => {
      // Arrange
      component.article = { ...mockArticle };
      const profile: Profile = {
        username: "testuser",
        bio: "Test Bio",
        image: "test.jpg",
        following: true,
      };

      // Act
      component.toggleFollowing(profile);

      // Assert
      expect(component.article.author.following).toBe(true);
    });
  });

  describe("deleteArticle", () => {
    it("should delete article and navigate to home", () => {
      // Arrange
      component.article = { ...mockArticle };
      mockArticlesService.delete.and.returnValue(of(void 0));

      // Act
      component.deleteArticle();

      // Assert
      expect(component.isDeleting).toBe(true);
      expect(mockArticlesService.delete).toHaveBeenCalledWith("test-article");
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/"]);
    });
  });

  describe("addComment", () => {
    beforeEach(() => {
      component.article = { ...mockArticle };
      component.comments = [];
    });

    it("should add comment successfully", () => {
      // Arrange
      const newComment: Comment = { ...mockComment, body: "New comment" };
      component.commentControl.setValue("New comment");
      mockCommentsService.add.and.returnValue(of(newComment));

      // Act
      component.addComment();

      // Assert
      expect(mockCommentsService.add).toHaveBeenCalledWith(
        "test-article",
        "New comment",
      );
      expect(component.comments.length).toBe(1);
      expect(component.comments[0]).toEqual(newComment);
      expect(component.commentControl.value).toBe("");
      expect(component.isSubmitting).toBe(false);
    });

    it("should handle comment add error", () => {
      // Arrange
      const error = { errors: { body: "cannot be empty" } };
      component.commentControl.setValue("Test comment");
      mockCommentsService.add.and.returnValue(throwError(() => error));

      // Act
      component.addComment();

      // Assert
      expect(component.isSubmitting).toBe(false);
      expect(component.commentFormErrors).toEqual(error);
    });
  });

  describe("deleteComment", () => {
    it("should delete comment from list", () => {
      // Arrange
      component.article = { ...mockArticle };
      component.comments = [mockComment];
      mockCommentsService.delete.and.returnValue(of(void 0));

      // Act
      component.deleteComment(mockComment);

      // Assert
      expect(mockCommentsService.delete).toHaveBeenCalledWith(
        "1",
        "test-article",
      );
      expect(component.comments.length).toBe(0);
    });
  });
});
